package com.imunidata.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entidade que representa um registro de vacinação.
 * Mapeada para a tabela REGISTRO_VACINACAO no banco H2.
 */
@Entity
@Table(name = "registro_vacinacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroVacinacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Município onde a vacinação foi aplicada */
    @Column(nullable = false)
    private String municipio;

    /** Sigla do estado (UF), ex: SP, RJ, MG */
    @Column(nullable = false, length = 2)
    private String estado;

    /**
     * Tipo de vacina aplicada.
     * Exemplos: BCG, Gripe, Polio, Pentavalente, Varicela
     */
    @Column(nullable = false)
    private String vacina;

    /**
     * Dose aplicada.
     * Valores possíveis: "1ª Dose", "2ª Dose", "Reforço"
     */
    @Column(nullable = false)
    private String dose;

    /** Quantidade de doses aplicadas neste registro */
    @Column(nullable = false)
    private Integer quantidadeAplicada;

    /** Data do registro de vacinação */
    @Column(nullable = false)
    private LocalDate dataRegistro;
}
