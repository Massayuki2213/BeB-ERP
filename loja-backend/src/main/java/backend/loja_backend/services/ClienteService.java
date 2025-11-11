package backend.loja_backend.services;

import backend.loja_backend.dto.ClienteDTO;
import backend.loja_backend.entity.Clientes;
import backend.loja_backend.repositories.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {
    
    @Autowired
    private ClienteRepository clienteRepositorie;
    
    public List<Clientes> listarTodos() {
        return clienteRepositorie.findAll();
    }
    
    public Optional<Clientes> buscarPorId(Long id) {
        return clienteRepositorie.findById(id);
    }
    
    public Clientes salvar(ClienteDTO cliente) {
        Clientes novoCliente = new Clientes();
        novoCliente.setNome(cliente.getNome());
        novoCliente.setTelefone(cliente.getTelefone());
        novoCliente.setEmail(cliente.getEmail());
        novoCliente.setEndereco(cliente.getEndereco());
        novoCliente.setCpfCnpj(cliente.getCpfCnpj());
        return clienteRepositorie.save(novoCliente);
    }
    
    public Clientes atualizar(Long id, Clientes clienteAtualizado) {
        return clienteRepositorie.findById(id)
            .map(cliente -> {
                cliente.setNome(clienteAtualizado.getNome());
                cliente.setTelefone(clienteAtualizado.getTelefone());
                cliente.setEmail(clienteAtualizado.getEmail());
                cliente.setEndereco(clienteAtualizado.getEndereco());
                cliente.setCpfCnpj(clienteAtualizado.getCpfCnpj());
                return clienteRepositorie.save(cliente);
            })
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
    }
    
    public void deletar(Long id) {
        clienteRepositorie.deleteById(id);
    }
}
