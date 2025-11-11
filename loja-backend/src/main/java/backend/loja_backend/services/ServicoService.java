package backend.loja_backend.services;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import backend.loja_backend.repositories.ServicoRepository;
import backend.loja_backend.dto.ServicoDTO;
import backend.loja_backend.entity.Servicos;

@Service
public class ServicoService {

    @Autowired
    private ServicoRepository servicoRepositorie;

    public Iterable<Servicos> listarTodos() {
        return servicoRepositorie.findAll();
    }

    public Optional<Servicos> buscarPorId(Long id) {
        return servicoRepositorie.findById(id);
    }
    
    public Servicos salvar(ServicoDTO servicoDTO) {
        Servicos servico = new Servicos();

        servico.setNome(servicoDTO.getNome());
        servico.setDescricao(servicoDTO.getDescricao());
        servico.setValorBase(servicoDTO.getValorBase());
        servico.setCategoria(servicoDTO.getCategoria());
        return servicoRepositorie.save(servico);
    }

    public Servicos atualizar(Long id, Servicos servicoAtualizado) {
        return servicoRepositorie.findById(id)
            .map(servico -> {
                servico.setNome(servicoAtualizado.getNome());
                servico.setDescricao(servicoAtualizado.getDescricao());
                servico.setValorBase(servicoAtualizado.getValorBase());
                servico.setCategoria(servicoAtualizado.getCategoria());
                return servicoRepositorie.save(servico);
            })
            .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));
    }

    public void deletar(Long id) {
        servicoRepositorie.deleteById(id);
    }
}
