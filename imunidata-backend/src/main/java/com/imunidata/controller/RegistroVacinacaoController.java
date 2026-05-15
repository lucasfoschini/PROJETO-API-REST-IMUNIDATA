package com.imunidata.controller;

import com.imunidata.model.RegistroVacinacao;
import com.imunidata.service.RegistroVacinacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;


@RestController
@RequestMapping("/api/vacinacao")
@CrossOrigin(origins = "*")
public class RegistroVacinacaoController {

    @Autowired
    private RegistroVacinacaoService service;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadCSV(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            service.importarCSV(file);
            return ResponseEntity.ok(Map.of("mensagem", "Arquivo importado com sucesso."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Falha ao importar arquivo: " + e.getMessage()));
        }
    }

    
    @GetMapping
    public ResponseEntity<List<RegistroVacinacao>> listar(
            @RequestParam(required = false) String vacina,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String dose
    ) {
        List<RegistroVacinacao> registros;

        boolean temFiltro = (vacina != null && !vacina.isBlank()) ||
                            (estado != null && !estado.isBlank()) ||
                            (dose != null && !dose.isBlank());

        if (temFiltro) {
            registros = service.filtrar(vacina, estado, dose);
        } else {
            registros = service.listarTodos();
        }

        return ResponseEntity.ok(registros);
    }

    
    @GetMapping("/{id}")
    public ResponseEntity<RegistroVacinacao> buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(registro -> ResponseEntity.ok(registro))
                .orElse(ResponseEntity.notFound().build());
    }

    
    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody RegistroVacinacao registro) {
        try {
            RegistroVacinacao salvo = service.cadastrar(registro);
            return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Dados inválidos: " + e.getMessage()));
        }
    }

    
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody RegistroVacinacao registro) {
        try {
            RegistroVacinacao atualizado = service.atualizar(id, registro);
            return ResponseEntity.ok(atualizado);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", e.getMessage()));
        }
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        try {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erro", e.getMessage()));
        }
    }

    
    @GetMapping("/por-vacina/{vacina}")
    public ResponseEntity<List<RegistroVacinacao>> porVacina(@PathVariable String vacina) {
        List<RegistroVacinacao> resultado = service.buscarPorVacina(vacina);
        return ResponseEntity.ok(resultado);
    }

    
    @GetMapping("/por-estado/{estado}")
    public ResponseEntity<List<RegistroVacinacao>> porEstado(@PathVariable String estado) {
        List<RegistroVacinacao> resultado = service.buscarPorEstado(estado);
        return ResponseEntity.ok(resultado);
    }

    
    @GetMapping("/resumo/por-estado")
    public ResponseEntity<Map<String, Long>> resumoPorEstado() {
        return ResponseEntity.ok(service.totalPorEstado());
    }

    
    @GetMapping("/resumo/por-vacina")
    public ResponseEntity<Map<String, Long>> resumoPorVacina() {
        return ResponseEntity.ok(service.totalPorVacina());
    }
}
