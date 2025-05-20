import { Colaborador } from './../../services/models/colaborador.model';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CardModule } from 'primeng/card';
import { Projeto, RetornoProjeto } from '../../services/models/projeto.model';
import { DropdownChangeEvent, DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule, formatDate } from '@angular/common';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CalendarModule } from 'primeng/calendar';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InformacoesColaboradorService } from '../../services/informacoes-colaborador.service';
import { firstValueFrom } from 'rxjs';
import { Message, MessageService } from 'primeng/api';
import { CorpoBusca } from '../../services/models/corpo-busca';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { BuscaLancamentos } from '../../services/models/busca-lancamentos';
import { format } from 'date-fns';
import { Lancamento } from '../../services/models/lancamento';

@Component({
  selector: 'app-dados-projeto',
  templateUrl: './dados-projeto.component.html',
  styleUrls: ['./dados-projeto.component.css'],
  standalone: true,
  providers: [MessageService],
  imports: [
    CardModule,
    DropdownModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    InputSwitchModule,
    CalendarModule,
    MessagesModule,
    ToastModule,
    RippleModule,
    InputNumberModule,
    DialogModule,
    FloatLabelModule,
  ],
})
export class DadosProjetoComponent implements OnInit {
  @Output()
  projetoSelecionadoEmit: EventEmitter<Projeto> = new EventEmitter<Projeto>();

  @Output()
  colaboradorEmitter: EventEmitter<string> = new EventEmitter<string>();

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  listaProjetos: Projeto[] = [];
  listaColaboradores: Colaborador[] = [];
  colaboradorCopiado: Colaborador;
  listaAlocaacoFullTime: string[] = ['Full-Time', 'Não Full-Time'];
  listaTipoAlocacao = [
    'C',
    'E',
    'CC',
    'EC',
    'CH',
    'FE',
    'SE',
    'P',
    'LM',
    'FD',
    'FS',
    'FG',
  ];
  apresentarFiltroData = false;
  apresentarPreenchimento = false;
  loading = false;
  dataInicio: Date;
  dataFinal: Date;
  dataInicioPreenchimento: Date;
  dataFinalPreenchimento: Date;
  alocacaoSelecionada: string;
  colaboradorParaBusca: string;
  colaboradorSelecionado: Colaborador;

  messages: Message[] | undefined = [
    {
      severity: 'error',
      detail: 'O colaborador já está presente ou previsto no projeto.',
    },
  ];

  desabilitar = false;
  apresentarErro = false;

  constructor(private messageService: MessageService) {}

  ngOnInit() {}

  preencheListaColaboradores(colaboradores: Colaborador[]): void {
    this.listaColaboradores = colaboradores;
  }

  carregarTabela(loading: boolean): void {
    this.loading = loading;
  }

  preencheListaProejtos(projetos: Projeto[]): void {
    this.listaProjetos = projetos;
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.desabilitar = desabilitar;
  }

  selecionarColaborador(colaborador: Colaborador): void {
    this.colaboradorSelecionado = colaborador;
  }

  selecionarProjeto(projeto: DropdownChangeEvent): void {
    this.apresentarErroColaboradorDuplicado(false);
    this.emitirColaborador();
  }

  async buscaLancamentos(): Promise<void> {
    try {
      this.carregarTabela(true);
      const projetos = await firstValueFrom(
        this.informacoesColaboradorService.buscaLancamentos(
          this.montaCorpoBusca()
        )
      );
      if (projetos.outputData.message) {
        this.notificarErro(
          'Erro ao buscar a lista de datas com lançamentos, ' +
            projetos.outputData.message
        );
      } else {
        const colaboradorDaLista = this.listaColaboradores.find(
          (f) => f.NMatricula == this.colaboradorSelecionado.NMatricula
        );
        if (colaboradorDaLista) {
          colaboradorDaLista.lancamentos = projetos.outputData.lancamentos;
        }
      }
      this.carregarTabela(false);
    } catch (error) {
      this.carregarTabela(false);
      console.error(error);
      this.notificarErro(
        'Erro ao buscar a lista de datas com lançamentos, tente mais tarde ou contate o admnistrador. ' +
          error
      );
    }
  }

  montaCorpoBusca(): BuscaLancamentos {
    return {
      nEmpresa: Number(this.colaboradorSelecionado.NEmpresa),
      nTipoColaborador: Number(this.colaboradorSelecionado.NTipoColaborador),
      nMatricula: Number(this.colaboradorSelecionado.NMatricula),
      nCodigoProjeto: Number(
        this.colaboradorSelecionado.projetoSelecionado.NId
      ),
      dDataInicio: this.formatarData(this.dataInicio),
      dDataFim: this.formatarData(this.dataFinal),
      aFullTime:
        this.colaboradorSelecionado.tipoAlocacaoSelecionado == 'Full-Time'
          ? 'S'
          : 'N',
    };
  }

  formatarData(data: Date): string {
    return format(data, 'dd/MM/yyyy');
  }

  stringParaDate(dataStr: string): Date {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  validaPlanejado(colaborador: Colaborador): string {
    let planejado = '-';
    if (colaborador.projetoSelecionado && colaborador.projetos)
      planejado =
        colaborador.projetos.find(
          (f) => f.NId == colaborador.projetoSelecionado.NId
        )?.NHorasTotais || '-';
    return planejado;
  }

  validaSaldo(colaborador: Colaborador): string {
    let saldo = '-';
    if (colaborador.projetoSelecionado && colaborador.projetos)
      saldo =
        colaborador.projetos.find(
          (f) => f.NId == colaborador.projetoSelecionado.NId
        )?.NDesvio || '-';
    return saldo;
  }

  inicializarFiltroData(colaborador: Colaborador): void {
    this.colaboradorSelecionado = colaborador;
    this.colaboradorSelecionado.validandoCampos = true;

    if (
      this.colaboradorSelecionado.projetoSelecionado &&
      this.colaboradorSelecionado.tipoAlocacaoSelecionado
    )
      this.apresentarFiltroData = true;
  }

  aplicarFiltroData(): void {
    if (this.dataInicio || this.dataFinal) {
      if (this.dataInicio && !this.dataFinal)
        this.dataFinal.setDate(this.dataInicio.getDate() + 30);
      else if (!this.dataInicio && this.dataFinal)
        this.dataInicio.setDate(this.dataInicio.getDate() - 30);

      this.buscaLancamentos();
    }
    this.apresentarFiltroData = false;
  }

  aplicarPreenchimento(): void {
    const colaboradorDaLista = this.listaColaboradores.find(
      (f) => f.NMatricula == this.colaboradorSelecionado.NMatricula
    );
    if (colaboradorDaLista) {
      colaboradorDaLista.lancamentos.forEach((lancamento) => {
        const dataLancamento = this.stringParaDate(lancamento.DData);
        if (
          (!this.dataInicioPreenchimento ||
            dataLancamento >= this.dataInicioPreenchimento) &&
          (!this.dataFinalPreenchimento ||
            dataLancamento <= this.dataFinalPreenchimento)
        )
          lancamento.ATipoLancamento = this.alocacaoSelecionada;
      });
    }
    this.apresentarPreenchimento = false;
  }

  colarColaborador(colaborador: Colaborador): void {
    colaborador.projetoSelecionado = this.colaboradorCopiado.projetoSelecionado;
    colaborador.tipoAlocacaoSelecionado =
      this.colaboradorCopiado.tipoAlocacaoSelecionado;
    colaborador.lancamentos = this.colaboradorCopiado.lancamentos;
  }

  emitirColaborador(): void {
    this.colaboradorEmitter.emit(this.colaboradorParaBusca);
  }

  notificarErro(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
    });
  }

  limparFormulario(): void {
    this.colaboradorSelecionado = null;
  }

  adicionarColaboradorAoProjeto(): void {
    this.apresentarErroColaboradorDuplicado(false);
  }

  validarHabilitarBotaoAdicionar(): boolean {
    return this.desabilitar || !this.colaboradorSelecionado;
  }

  apresentarErroColaboradorDuplicado(apresentar: boolean): void {
    this.apresentarErro = apresentar;
  }
}
