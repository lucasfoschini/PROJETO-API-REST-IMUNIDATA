package com.imunidata.service;

import com.imunidata.model.RegistroVacinacao;
import com.imunidata.repository.RegistroVacinacaoRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class RegistroVacinacaoService {

    private static final Logger log = LoggerFactory.getLogger(RegistroVacinacaoService.class);

    @Autowired
    private RegistroVacinacaoRepository repository;

    @PostConstruct
    public void inicializarDados() {
        log.info("Iniciando carga de dados fixa do CSV...");
        try (
            Reader reader = new InputStreamReader(
                getClass().getClassLoader().getResourceAsStream("dados_vacinacao.csv"),
                StandardCharsets.UTF_8
            );
            CSVReader csvReader = new CSVReader(reader)
        ) {
            processarLinhasCSV(csvReader);
            log.info("Carga inicial concluída. Total de registros: {}", repository.count());
        } catch (Exception e) {
            log.error("Erro na carga inicial de dados: {}", e.getMessage());
        }
    }

    public void importarCSV(org.springframework.web.multipart.MultipartFile file) {
        try (
            Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
            CSVReader csvReader = new CSVReader(reader)
        ) {
            processarLinhasCSV(csvReader);
        } catch (IOException | CsvException e) {
            log.error("Falha ao carregar o arquivo CSV: {}", e.getMessage());
        }
    }

    private void processarLinhasCSV(CSVReader csvReader) throws IOException, CsvException {
        List<String[]> linhas = csvReader.readAll();
        if (linhas.isEmpty()) {
            log.warn("CSV vazio. Nenhum registro importado.");
            return;
        }

        String[] cabecalho = linhas.get(0);
        Map<String, Integer> headerIndex = new HashMap<>();
        for (int i = 0; i < cabecalho.length; i++) {
            String chave = normalizarCabecalho(cabecalho[i]);
            if (!chave.isBlank() && !headerIndex.containsKey(chave)) {
                headerIndex.put(chave, i);
            }
        }

        int idxMunicipio = encontrarIndice(headerIndex,
            "municipio",
            "municipioresidencia",
            "municipioaplicacao",
            "municipio_residencia",
            "municipio_aplicacao",
            "nome_municipio",
            "mun_res",
            "mun_apl",
            "mun");
        int idxEstado = encontrarIndice(headerIndex,
            "estado",
            "uf",
            "sguf",
            "siglauf",
            "ufresidencia",
            "ufaplicacao",
            "estado_residencia",
            "estado_aplicacao");
        int idxVacina = encontrarIndice(headerIndex,
            "vacina",
            "nomevacina",
            "nmvacina",
            "imunobiologico",
            "imunobiologicodesc",
            "vacina_desc");
        int idxDose = encontrarIndice(headerIndex,
            "dose",
            "dsdose",
            "doseaplicada",
            "dose_desc",
            "dosevacina");
        int idxQuantidade = encontrarIndice(headerIndex,
            "quantidadeaplicada",
            "quantidade",
            "qtdaplicada",
            "qtd",
            "qtdaplicacoes",
            "quantidade_registros",
            "total",
            "contagem",
            "count");
        int idxData = encontrarIndice(headerIndex,
            "dataregistro",
            "dataaplicacao",
            "data",
            "dtaplicacao",
            "dtregistro",
            "datavacinacao",
            "data_atendimento");

        int encontrados = 0;
        if (idxMunicipio >= 0) encontrados++;
        if (idxEstado >= 0) encontrados++;
        if (idxVacina >= 0) encontrados++;
        if (idxDose >= 0) encontrados++;
        if (idxQuantidade >= 0) encontrados++;
        if (idxData >= 0) encontrados++;

        boolean faltamObrigatorios = idxMunicipio < 0 || idxEstado < 0 || idxVacina < 0 || idxData < 0;
        int inicioDados = 1;

        if (faltamObrigatorios) {
            if (encontrados == 0 && cabecalho.length >= 6) {
                log.warn("Cabecalho nao detectado. Usando ordem fixa de colunas.");
                idxMunicipio = 0;
                idxEstado = 1;
                idxVacina = 2;
                idxDose = 3;
                idxQuantidade = 4;
                idxData = 5;
                inicioDados = 0;
            } else {
                log.error("Cabecalho incompleto. Necessario: municipio, estado, vacina, dataRegistro.");
                return;
            }
        }

        if (idxDose < 0) {
            log.warn("Coluna de dose nao encontrada. Usando valor padrao.");
        }
        if (idxQuantidade < 0) {
            log.warn("Coluna de quantidade nao encontrada. Usando valor padrao.");
        }

        for (int i = inicioDados; i < linhas.size(); i++) {
            String[] campos = linhas.get(i);
            int numeroLinha = i + 1;

            String municipio = obterCampo(campos, idxMunicipio);
            String estado = obterCampo(campos, idxEstado);
            String vacina = obterCampo(campos, idxVacina);
            String dose = obterCampo(campos, idxDose);
            String quantidadeRaw = obterCampo(campos, idxQuantidade);
            String dataRaw = obterCampo(campos, idxData);

            if (municipio == null || estado == null || vacina == null || dataRaw == null ||
                municipio.isBlank() || estado.isBlank() || vacina.isBlank() || dataRaw.isBlank()) {
                log.warn("Linha {} ignorada (colunas obrigatorias ausentes).", numeroLinha);
                continue;
            }

            try {
                RegistroVacinacao registro = new RegistroVacinacao();
                registro.setMunicipio(municipio);
                registro.setEstado(estado);
                registro.setVacina(vacina);
                registro.setDose(padraoSeVazio(dose, "Nao informado"));
                registro.setQuantidadeAplicada(parseQuantidade(quantidadeRaw));
                registro.setDataRegistro(parseDataRegistro(dataRaw));

                repository.save(registro);
            } catch (NumberFormatException | DateTimeParseException e) {
                log.error("Erro ao processar linha {}: {}", numeroLinha, e.getMessage());
            } catch (Exception e) {
                log.error("Erro ao processar linha {}: {}", numeroLinha, e.getMessage());
            }
        }
    }

    private String normalizarCabecalho(String valor) {
        if (valor == null) {
            return "";
        }
        String normalizado = Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
        return normalizado.replaceAll("[^a-z0-9]", "");
    }

    private int encontrarIndice(Map<String, Integer> headerIndex, String... candidatos) {
        for (String candidato : candidatos) {
            String chave = normalizarCabecalho(candidato);
            Integer idx = headerIndex.get(chave);
            if (idx != null) {
                return idx;
            }
        }
        return -1;
    }

    private String obterCampo(String[] campos, int indice) {
        if (indice < 0 || indice >= campos.length) {
            return null;
        }
        String valor = campos[indice];
        return valor == null ? null : valor.trim();
    }

    private LocalDate parseDataRegistro(String valor) {
        String limpo = valor.trim();
        String dataParte = limpo.split("[T ]")[0];
        if (dataParte.matches("\\d{4}-\\d{2}$")) {
            dataParte = dataParte + "-01";
        } else if (dataParte.matches("\\d{2}/\\d{4}$")) {
            dataParte = "01/" + dataParte;
        }
        try {
            return LocalDate.parse(dataParte);
        } catch (DateTimeParseException e) {
            DateTimeFormatter[] formatos = new DateTimeFormatter[] {
                    DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                    DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                    DateTimeFormatter.ofPattern("yyyy/MM/dd")
            };
            for (DateTimeFormatter fmt : formatos) {
                try {
                    return LocalDate.parse(dataParte, fmt);
                } catch (DateTimeParseException ignored) {
                }
            }
            throw e;
        }
    }

    private String padraoSeVazio(String valor, String padrao) {
        if (valor == null) {
            return padrao;
        }
        String limpo = valor.trim();
        return limpo.isEmpty() ? padrao : limpo;
    }

    private Integer parseQuantidade(String valor) {
        if (valor == null) {
            return 1;
        }
        String limpo = valor.trim();
        if (limpo.isEmpty()) {
            return 1;
        }
        String apenasDigitos = limpo.replaceAll("[^0-9]", "");
        if (apenasDigitos.isEmpty()) {
            return 1;
        }
        return Integer.parseInt(apenasDigitos);
    }

    
    public List<RegistroVacinacao> listarTodos() {
        return repository.findAll();
    }

    
    public Optional<RegistroVacinacao> buscarPorId(Long id) {
        return repository.findById(id);
    }

    
    public RegistroVacinacao cadastrar(RegistroVacinacao registro) {
        log.info("Cadastrando novo registro: vacina={}, municipio={}", registro.getVacina(), registro.getMunicipio());
        return repository.save(registro);
    }

    
    public RegistroVacinacao atualizar(Long id, RegistroVacinacao dadosNovos) {
        RegistroVacinacao existente = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Registro não encontrado com ID: " + id));

        existente.setMunicipio(dadosNovos.getMunicipio());
        existente.setEstado(dadosNovos.getEstado());
        existente.setVacina(dadosNovos.getVacina());
        existente.setDose(dadosNovos.getDose());
        existente.setQuantidadeAplicada(dadosNovos.getQuantidadeAplicada());
        existente.setDataRegistro(dadosNovos.getDataRegistro());

        log.info("Registro ID {} atualizado.", id);
        return repository.save(existente);
    }

    
    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("Registro não encontrado com ID: " + id);
        }
        log.info("Excluindo registro ID {}.", id);
        repository.deleteById(id);
    }

    
    public List<RegistroVacinacao> buscarPorVacina(String vacina) {
        return repository.findByVacina(vacina);
    }

    
    public List<RegistroVacinacao> buscarPorEstado(String estado) {
        return repository.findByEstado(estado);
    }

    
    public List<RegistroVacinacao> filtrar(String vacina, String estado, String dose) {
        String v = (vacina != null && !vacina.isBlank()) ? vacina : null;
        String e = (estado != null && !estado.isBlank()) ? estado : null;
        String d = (dose != null && !dose.isBlank()) ? dose : null;
        return repository.filtrar(v, e, d);
    }

    
    public Map<String, Long> totalPorEstado() {
        return repository.totalDosesPorEstado()
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    
    public Map<String, Long> totalPorVacina() {
        return repository.totalDosesPorVacina()
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }
}
