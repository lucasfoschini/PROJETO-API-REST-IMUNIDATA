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


@Service
public class RegistroVacinacaoService {

    private static final Logger log = LoggerFactory.getLogger(RegistroVacinacaoService.class);

    @Autowired
    private RegistroVacinacaoRepository repository;

    public void importarCSV(org.springframework.web.multipart.MultipartFile file) {
        try (
            Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
            CSVReader csvReader = new CSVReader(reader)
        ) {
            List<String[]> linhas = csvReader.readAll();
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
