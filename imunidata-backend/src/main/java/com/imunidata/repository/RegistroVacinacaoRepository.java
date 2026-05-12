package com.imunidata.repository;

import com.imunidata.model.RegistroVacinacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository responsável pelo acesso aos dados de RegistroVacinacao.
 * Extende JpaRepository para herdar operações CRUD básicas.
 */
@Repository
public interface RegistroVacinacaoRepository extends JpaRepository<RegistroVacinacao, Long> {

    /**
     * Busca todos os registros de um tipo específico de vacina.
     * Spring Data gera a query automaticamente pelo nome do método.
     *
     * @param vacina Nome da vacina (ex: "BCG", "Gripe")
     */
    List<RegistroVacinacao> findByVacina(String vacina);

    /**
     * Busca todos os registros de um estado (UF).
     *
     * @param estado Sigla do estado (ex: "SP", "RJ")
     */
    List<RegistroVacinacao> findByEstado(String estado);

    /**
     * Busca registros filtrando por vacina e estado simultaneamente.
     */
    List<RegistroVacinacao> findByVacinaAndEstado(String vacina, String estado);

    /**
     * Busca registros por município (busca parcial, case-insensitive).
     */
    List<RegistroVacinacao> findByMunicipioContainingIgnoreCase(String municipio);

    /**
     * Retorna a soma total de doses aplicadas agrupadas por estado.
     * Utilizado para o resumo do dashboard.
     */
    @Query("SELECT r.estado, SUM(r.quantidadeAplicada) FROM RegistroVacinacao r GROUP BY r.estado ORDER BY r.estado")
    List<Object[]> totalDosesPorEstado();

    /**
     * Retorna a soma total de doses aplicadas agrupadas por tipo de vacina.
     */
    @Query("SELECT r.vacina, SUM(r.quantidadeAplicada) FROM RegistroVacinacao r GROUP BY r.vacina ORDER BY r.vacina")
    List<Object[]> totalDosesPorVacina();

    /**
     * Filtro combinado opcional: vacina e/ou estado podem ser nulos.
     */
    @Query("SELECT r FROM RegistroVacinacao r WHERE " +
           "(:vacina IS NULL OR r.vacina = :vacina) AND " +
           "(:estado IS NULL OR r.estado = :estado)")
    List<RegistroVacinacao> filtrar(
            @Param("vacina") String vacina,
            @Param("estado") String estado
    );
}
