package backend.loja_backend.veiculo;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.loja_backend.cliente.ClienteRepository;
import backend.loja_backend.cliente.Clientes;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VeiculoService {

    private final VeiculoRepository veiculoRepository;
    private final ClienteRepository clienteRepository;

    public List<Veiculo> listarTodos() {
        return veiculoRepository.findAll();
    }

    public Optional<Veiculo> buscarPorId(Long id) {
        return veiculoRepository.findById(id);
    }

    public List<Veiculo> listarPorCliente(Long clienteId) {
        return veiculoRepository.findByClienteId(clienteId);
    }

    public Optional<Veiculo> buscarPorPlaca(String placa) {
        return veiculoRepository.findByPlaca(placa);
    }

    public Veiculo salvar(VeiculoDTO dto) {
        Clientes cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado: " + dto.getClienteId()));

        Veiculo veiculo = new Veiculo();
        veiculo.setPlaca(dto.getPlaca());
        veiculo.setMarca(dto.getMarca());
        veiculo.setModelo(dto.getModelo());
        veiculo.setAno(dto.getAno());
        veiculo.setCor(dto.getCor());
        veiculo.setCliente(cliente);
        return veiculoRepository.save(veiculo);
    }

    public Veiculo atualizar(Long id, VeiculoDTO dto) {
        Veiculo veiculo = veiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado: " + id));

        // cliente e placa são obrigatórios: só troca se vier no payload
        if (dto.getClienteId() != null) {
            Clientes cliente = clienteRepository.findById(dto.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente não encontrado: " + dto.getClienteId()));
            veiculo.setCliente(cliente);
        }
        if (dto.getPlaca() != null) {
            veiculo.setPlaca(dto.getPlaca());
        }
        veiculo.setMarca(dto.getMarca());
        veiculo.setModelo(dto.getModelo());
        veiculo.setAno(dto.getAno());
        veiculo.setCor(dto.getCor());
        return veiculoRepository.save(veiculo);
    }

    public void deletar(Long id) {
        veiculoRepository.deleteById(id);
    }
}
