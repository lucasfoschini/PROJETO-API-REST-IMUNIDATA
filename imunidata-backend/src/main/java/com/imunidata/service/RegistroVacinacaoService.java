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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Camada de serviço responsável pela lógica de negócio do sistema ImuniData.
 * 
 * O uso de Optional é um princípio fundamental aqui: ele força o código
 * que chama os métodos a lidar explicitamente com a possibilidade de
 * ausência de dados, eliminando NullPointerExceptions silenciosas.
 */
@Service
public class RegistroVacinacaoService {

    private static final Logger log = LoggerFactory.getLogger(RegistroVacinacaoService.class);

    @Autowired
    private RegistroVacinacaoRepository repository;

    // =========================================================
    // CARGA INICIAL DE DADOS (CSV)
    // =========================================================

    /**
     * Executado automaticamente após o Spring inicializar o bean.
     * Carrega os dados do arquivo CSV para popular o banco H2.
     */
    @PostConstruct
    public void inicializarDados() {
        log.info("Iniciando carga de dados do CSV...");
        carregarCSV();
        log.info("Carga concluída. Total de registros: {}", repository.count());
    }

    /**
     * Lê o arquivo dados_vacinacao.csv do classpath e persiste cada linha
     * como um RegistroVacinacao no banco H2.
     *
     * Estrutura do CSV:
     * municipio, estado, vacina, dose, quantidadeAplicada, dataRegistro
     */
    public void carregarCSV() {
        try (
            Reader reader = new InputStreamReader(
                getClass().getClassLoader().getResourceAsStream("dados_vacinacao.csv"),
                StandardCharsets.UTF_8
            );
            CSVReader csvReader = new CSVReader(reader)
        ) {
            List<String[]> linhas = csvReader.readAll();

            // Pula o cabeçalho (linha 0)
            for (int i = 1; i < linhas.size(); i++) {
                String[] campos = linhas.get(i);

                if (campos.length < 6) {
                    log.warn("Linha {} ignorada (campos insuficientes): {}", i, String.join(",", campos));
                    continue;
                }

                try {
                    RegistroVacinacao registro = new RegistroVacinacao();
                    registro.setMunicipio(campos[0].trim());
                    registro.setEstado(campos[1].trim());
                    registro.setVacina(campos[2].trim());
                    registro.setDose(campos[3].trim());
                    registro.setQuantidadeAplicada(Integer.parseInt(campos[4].trim()));
                    registro.setDataRegistro(LocalDate.parse(campos[5].trim()));

                    repository.save(registro);
                } catch (Exception e) {
                    log.error("Erro ao processar linha {}: {}", i, e.getMessage());
                }
            }

        } catch (IOException | CsvException e) {
            log.error("Falha ao carregar o arquivo CSV: {}", e.getMessage());
        }
    }

    // =========================================================
    // CRUD
    // =========================================================

    /** Retorna todos os registros de vacinação cadastrados. */
    public List<RegistroVacinacao> listarTodos() {
        return repository.findAll();
    }

    /**
     * Busca um registro por ID usando Optional.
     *
     * Por que Optional? Se usássemos repository.getById(id) sem Optional,
     * um ID inexistente lançaria uma exceção genérica em tempo de execução.
     * Com Optional, deixamos explícito que "pode não existir" e tratamos
     * o caso de ausência de forma controlada.
     *
     * @throws NoSuchElementException se o ID não for encontrado
     */
    public Optional<RegistroVacinacao> buscarPorId(Long id) {
        return repository.findById(id);
    }

    /** Cadastra um novo registro de vacinação. */
    public RegistroVacinacao cadastrar(RegistroVacinacao registro) {
        log.info("Cadastrando novo registro: vacina={}, municipio={}", registro.getVacina(), registro.getMunicipio());
        return repository.save(registro);
    }

    /**
     * Atualiza os dados de um registro existente.
     * Usa Optional para verificar existência antes de atualizar.
     *
     * @throws NoSuchElementException se o ID não existir
     */
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

    /**
     * Exclui um registro pelo ID.
     * Verifica existência antes de deletar para retornar erro semântico correto.
     *
     * @throws NoSuchElementException se o ID não existir
     */
    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("Registro não encontrado com ID: " + id);
        }
        log.info("Excluindo registro ID {}.", id);
        repository.deleteById(id);
    }

    // =========================================================
    // CONSULTAS ESPECIALIZADAS
    // =========================================================

    /** Retorna registros filtrados por tipo de vacina. */
    public List<RegistroVacinacao> buscarPorVacina(String vacina) {
        return repository.findByVacina(vacina);
    }

    /** Retorna registros filtrados por estado (UF). */
    public List<RegistroVacinacao> buscarPorEstado(String estado) {
        return repository.findByEstado(estado);
    }

    /**
     * Filtro combinado opcional: vacina e/ou estado.
     * Parâmetros nulos ou vazios são ignorados no filtro.
     */
    public List<RegistroVacinacao> filtrar(String vacina, String estado) {
        String v = (vacina != null && !vacina.isBlank()) ? vacina : null;
        String e = (estado != null && !estado.isBlank()) ? estado : null;
        return repository.filtrar(v, e);
    }

    /** Retorna totais de doses agrupados por estado (para dashboard). */
    public Map<String, Long> totalPorEstado() {
        return repository.totalDosesPorEstado()
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    /** Retorna totais de doses agrupados por vacina (para dashboard). */
    public Map<String, Long> totalPorVacina() {
        return repository.totalDosesPorVacina()
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }
}
