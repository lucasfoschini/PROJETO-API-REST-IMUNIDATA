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

/**
 * Controller REST para o recurso RegistroVacinacao.
 *
 * Todos os endpoints retornam ResponseEntity para controle explícito
 * dos status HTTP: 200 OK, 201 Created, 404 Not Found, 400 Bad Request.
 *
 * @CrossOrigin: Permite que o frontend React (porta 5173) acesse a API (porta 8080).
 */
@RestController
@RequestMapping("/api/vacinacao")
@CrossOrigin(origins = "*")
public class RegistroVacinacaoController {

    @Autowired
    private RegistroVacinacaoService service;

    // =========================================================
    // CRUD BÁSICO
    // =========================================================

    /**
     * GET /api/vacinacao
     * Lista todos os registros de vacinação.
     * Suporta filtros opcionais via query params: ?vacina=BCG&estado=SP
     *
     * @return 200 OK com a lista de registros
     */
    @GetMapping
    public ResponseEntity<List<RegistroVacinacao>> listar(
            @RequestParam(required = false) String vacina,
            @RequestParam(required = false) String estado
    ) {
        List<RegistroVacinacao> registros;

        boolean temFiltro = (vacina != null && !vacina.isBlank()) ||
                            (estado != null && !estado.isBlank());

        if (temFiltro) {
            registros = service.filtrar(vacina, estado);
        } else {
            registros = service.listarTodos();
        }

        return ResponseEntity.ok(registros);
    }

    /**
     * GET /api/vacinacao/{id}
     * Busca um registro específico pelo ID.
     *
     * @return 200 OK com o registro encontrado
     *         404 Not Found se o ID não existir
     */
    @GetMapping("/{id}")
    public ResponseEntity<RegistroVacinacao> buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(registro -> ResponseEntity.ok(registro))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/vacinacao
     * Cadastra um novo registro de vacinação.
     *
     * @param registro Objeto JSON no corpo da requisição
     * @return 201 Created com o registro persistido (incluindo ID gerado)
     *         400 Bad Request em caso de erro de validação
     */
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

    /**
     * PUT /api/vacinacao/{id}
     * Atualiza um registro existente.
     *
     * @return 200 OK com o registro atualizado
     *         404 Not Found se o ID não existir
     */
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

    /**
     * DELETE /api/vacinacao/{id}
     * Exclui um registro pelo ID.
     *
     * @return 204 No Content em caso de sucesso
     *         404 Not Found se o ID não existir
     */
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

    // =========================================================
    // CONSULTAS ESPECIALIZADAS
    // =========================================================

    /**
     * GET /api/vacinacao/por-vacina/{vacina}
     * Retorna registros filtrados pelo tipo de vacina.
     *
     * @return 200 OK com a lista filtrada
     */
    @GetMapping("/por-vacina/{vacina}")
    public ResponseEntity<List<RegistroVacinacao>> porVacina(@PathVariable String vacina) {
        List<RegistroVacinacao> resultado = service.buscarPorVacina(vacina);
        return ResponseEntity.ok(resultado);
    }

    /**
     * GET /api/vacinacao/por-estado/{estado}
     * Retorna registros filtrados pelo estado (UF).
     *
     * @return 200 OK com a lista filtrada
     */
    @GetMapping("/por-estado/{estado}")
    public ResponseEntity<List<RegistroVacinacao>> porEstado(@PathVariable String estado) {
        List<RegistroVacinacao> resultado = service.buscarPorEstado(estado);
        return ResponseEntity.ok(resultado);
    }

    /**
     * GET /api/vacinacao/resumo/por-estado
     * Retorna o total de doses aplicadas agrupadas por estado.
     * Usado para construir o dashboard de resumo.
     *
     * @return 200 OK com Map<estado, totalDoses>
     */
    @GetMapping("/resumo/por-estado")
    public ResponseEntity<Map<String, Long>> resumoPorEstado() {
        return ResponseEntity.ok(service.totalPorEstado());
    }

    /**
     * GET /api/vacinacao/resumo/por-vacina
     * Retorna o total de doses agrupadas por tipo de vacina.
     *
     * @return 200 OK com Map<vacina, totalDoses>
     */
    @GetMapping("/resumo/por-vacina")
    public ResponseEntity<Map<String, Long>> resumoPorVacina() {
        return ResponseEntity.ok(service.totalPorVacina());
    }
}
