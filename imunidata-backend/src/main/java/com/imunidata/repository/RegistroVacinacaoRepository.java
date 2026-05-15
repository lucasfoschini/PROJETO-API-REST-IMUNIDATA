package com.imunidata.repository;

import com.imunidata.model.RegistroVacinacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface RegistroVacinacaoRepository extends JpaRepository<RegistroVacinacao, Long> {

    
    List<RegistroVacinacao> findByVacina(String vacina);

    
    List<RegistroVacinacao> findByEstado(String estado);

    
    List<RegistroVacinacao> findByVacinaAndEstado(String vacina, String estado);

    
    List<RegistroVacinacao> findByMunicipioContainingIgnoreCase(String municipio);

    
    @Query("SELECT r.estado, SUM(r.quantidadeAplicada) FROM RegistroVacinacao r GROUP BY r.estado ORDER BY r.estado")
    List<Object[]> totalDosesPorEstado();

    
    @Query("SELECT r.vacina, SUM(r.quantidadeAplicada) FROM RegistroVacinacao r GROUP BY r.vacina ORDER BY r.vacina")
    List<Object[]> totalDosesPorVacina();

    
    @Query("SELECT r FROM RegistroVacinacao r WHERE " +
           "(:vacina IS NULL OR r.vacina = :vacina) AND " +
           "(:estado IS NULL OR r.estado = :estado) AND " +
           "(:dose IS NULL OR r.dose = :dose)")
    List<RegistroVacinacao> filtrar(
            @Param("vacina") String vacina,
            @Param("estado") String estado,
            @Param("dose") String dose
    );
}
