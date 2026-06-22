package backend.loja_backend.agenda;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import backend.loja_backend.cliente.ClienteRepository;
import backend.loja_backend.common.exception.AgendamentoNaoEncontradoException;
import backend.loja_backend.common.exception.ClienteNaoEncontradoException;
import backend.loja_backend.common.exception.OrdemServicoNaoEncontradaException;
import backend.loja_backend.common.exception.RegraDeNegocioException;
import backend.loja_backend.common.exception.VeiculoNaoEncontradoException;
import backend.loja_backend.ordemservico.OrdemServicoRepository;
import backend.loja_backend.veiculo.VeiculoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AgendaService {

    private final AgendamentoRepository repo;
    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;
    private final OrdemServicoRepository ordemServicoRepository;

    @Transactional
    public Agendamento criar(AgendamentoDTO dto) {
        Agendamento a = new Agendamento();
        a.setStatus(StatusAgendamento.AGENDADO);
        aplicar(a, dto);
        validar(a);
        return repo.save(a);
    }

    @Transactional
    public Agendamento atualizar(Long id, AgendamentoDTO dto) {
        Agendamento a = buscar(id);
        aplicar(a, dto);
        validar(a);
        return repo.save(a);
    }

    @Transactional
    public Agendamento atualizarStatus(Long id, String statusStr) {
        Agendamento a = buscar(id);
        a.setStatus(parseStatus(statusStr));
        return repo.save(a);
    }

    @Transactional
    public void deletar(Long id) {
        repo.deleteById(id);
    }

    public List<Agendamento> listarTodos() {
        return repo.findAllByOrderByDataHoraInicioAsc();
    }

    public Optional<Agendamento> buscarPorId(Long id) {
        return repo.findById(id);
    }

    public List<Agendamento> listarPorPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        return repo.findByDataHoraInicioBetweenOrderByDataHoraInicioAsc(inicio, fim);
    }

    public List<Agendamento> listarPorBox(Integer box) {
        return repo.findByBoxOrderByDataHoraInicioAsc(box);
    }

    public List<Agendamento> listarPorVeiculo(Long veiculoId) {
        return repo.findByVeiculoIdOrderByDataHoraInicioDesc(veiculoId);
    }

    // -------------------------------------------------------------- internos

    private void aplicar(Agendamento a, AgendamentoDTO dto) {
        if (dto.getBox() != null) a.setBox(dto.getBox());
        if (dto.getDataHoraInicio() != null) a.setDataHoraInicio(dto.getDataHoraInicio());
        if (dto.getDataHoraFim() != null) a.setDataHoraFim(dto.getDataHoraFim());
        if (dto.getDescricao() != null) a.setDescricao(dto.getDescricao());
        if (dto.getStatus() != null) a.setStatus(parseStatus(dto.getStatus()));

        if (dto.getClienteId() != null) {
            a.setCliente(clienteRepository.findById(dto.getClienteId())
                    .orElseThrow(() -> new ClienteNaoEncontradoException(dto.getClienteId())));
        }
        if (dto.getVeiculoId() != null) {
            a.setVeiculo(veiculoRepository.findById(dto.getVeiculoId())
                    .orElseThrow(() -> new VeiculoNaoEncontradoException(dto.getVeiculoId())));
        }
        if (dto.getOrdemServicoId() != null) {
            a.setOrdemServico(ordemServicoRepository.findById(dto.getOrdemServicoId())
                    .orElseThrow(() -> new OrdemServicoNaoEncontradaException(dto.getOrdemServicoId())));
        }
    }

    private void validar(Agendamento a) {
        if (a.getBox() == null) throw new RegraDeNegocioException("box é obrigatório");
        if (a.getDataHoraInicio() == null) throw new RegraDeNegocioException("dataHoraInicio é obrigatória");
        if (a.getDataHoraFim() == null) {
            a.setDataHoraFim(a.getDataHoraInicio().plusHours(1));
        }
        if (!a.getDataHoraFim().isAfter(a.getDataHoraInicio())) {
            throw new RegraDeNegocioException("dataHoraFim deve ser depois de dataHoraInicio");
        }

        // Não encavalar: nenhum outro agendamento ativo no mesmo box sobreposto no tempo
        List<Agendamento> sobrepostos = repo.findByBoxAndDataHoraInicioLessThanAndDataHoraFimGreaterThan(
                a.getBox(), a.getDataHoraFim(), a.getDataHoraInicio());
        boolean conflito = sobrepostos.stream()
                .anyMatch(o -> o.getStatus() != StatusAgendamento.CANCELADO && !o.getId().equals(a.getId()));
        if (conflito) {
            throw new RegraDeNegocioException("Box " + a.getBox() + " já está ocupado nesse horário.");
        }
    }

    private Agendamento buscar(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new AgendamentoNaoEncontradoException(id));
    }

    private StatusAgendamento parseStatus(String s) {
        try {
            return StatusAgendamento.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new RegraDeNegocioException("Status inválido: " + s
                    + ". Use: AGENDADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO, NAO_COMPARECEU");
        }
    }
}
