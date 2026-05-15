package com.imunidata.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;


@Entity
@Table(name = "registro_vacinacao")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroVacinacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    @Column(nullable = false)
    private String municipio;

    
    @Column(nullable = false, length = 2)
    private String estado;

    
    @Column(nullable = false)
    private String vacina;

    
    @Column(nullable = false)
    private String dose;

    
    @Column(nullable = false)
    private Integer quantidadeAplicada;

    
    @Column(nullable = false)
    private LocalDate dataRegistro;
}
