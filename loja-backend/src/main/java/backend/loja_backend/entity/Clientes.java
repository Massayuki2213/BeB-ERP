package backend.loja_backend.entity;
import jakarta.persistence.*;
import lombok.Data;


@Entity
@Table(name = "clientes")
@Data
public class Clientes {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nome;
    private String telefone;
    private String email;
    private String endereco;
    @Column(name = "cpf_cnpj")
    private String cpfCnpj;
    
    @PrePersist
    protected void PrePersist() {
        if (this.id != null && this.id==0 ) {
            this.id = null;
        }
    }
}

