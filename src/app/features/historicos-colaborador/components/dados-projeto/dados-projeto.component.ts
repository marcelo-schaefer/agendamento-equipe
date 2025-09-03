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
import { eachDayOfInterval, format } from 'date-fns';
import { Lancamento } from '../../services/models/lancamento';
import { BuscaColaboradoresComponent } from '../busca-colaboradores/busca-colaboradores.component';
import { PanelModule } from 'primeng/panel';
import { LegendaSiglas } from '../../services/models/legenda-siglas';
import { Feriado } from '../../services/models/feriado';

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
    BuscaColaboradoresComponent,
    PanelModule,
  ],
})
export class DadosProjetoComponent implements OnInit, AfterViewInit {
  @ViewChild(BuscaColaboradoresComponent, { static: true })
  buscaColaboradoresComponent: BuscaColaboradoresComponent | undefined;

  @Output()
  enviarSolicitacao: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  colaboradorEmitter: EventEmitter<string> = new EventEmitter<string>();

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  listaProjetos: Projeto[] = [];
  projetosFiltrados: Projeto[] = [];
  listaColaboradores: Colaborador[] = [];
  colaboradorCopiado: Colaborador;
  listaAlocaacoFullTime: string[] = ['Full-Time', 'Não Full-Time'];
  listaTipoAlocacao = [
    'Cam',
    'Esc',
    'CamP',
    'EscP',
    'CH',
    'Fe',
    'P',
    'LM',
    'FD',
    'RS',
    'DSR',
  ];
  listaColunas: string[] = [];
  apresentarFiltroData = false;
  apresentarPreenchimento = false;
  loading = false;
  erroNasDatas = false;
  desabilitar = false;
  dataInicio: Date;
  dataFinal: Date;
  dataInicioMinimaPreenchimento: Date;
  dataFinalMaximaPreenchimento: Date;
  dataInicioPreenchimento: Date;
  dataFinalPreenchimento: Date;
  alocacaoSelecionada: string;
  colaboradorParaBusca: string;
  colaboradorSelecionado: Colaborador;
  listaLegendas: LegendaSiglas[] = [];
  feriados: Feriado[] = [];

  messages: Message[] | undefined = [
    {
      severity: 'info',
      detail: 'Salve as alterações antes de buscar novas datas',
    },
  ];
  expandedRows: { [key: string]: boolean } = {};

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    console.log('Inicializando componente');
    this.criaListaLegendaSiglas();
  }

  ngAfterViewInit(): void {
    console.log('Finalizando inicialização do componente');
  }

  preencheListaColaboradores(colaboradores: Colaborador[]): void {
    this.listaColaboradores = colaboradores;
    this.expandedRows = {};
  }

  preencherPapelAdm(papelAdm: string): void {
    this.buscaColaboradoresComponent?.preencherPapelAdm(papelAdm);
  }

  preencherFeriados(feriados: Feriado[]): void {
    this.feriados = feriados;
  }

  geraOpcoesIniciais(): void {
    this.buscaColaboradoresComponent.opcoesIniciais();
  }

  carregarTabela(loading: boolean): void {
    this.loading = loading;
  }

  preencheListaProjetos(projetos: Projeto[]): void {
    this.listaProjetos = projetos;
    this.projetosFiltrados = this.listaProjetos;
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.carregarTabela(desabilitar);
    this.desabilitar = desabilitar;
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
          (f) => f.id == this.colaboradorSelecionado.id
        );
        if (colaboradorDaLista) {
          if (!Array.isArray(projetos.outputData.lancamentos))
            projetos.outputData.lancamentos = [projetos.outputData.lancamentos];
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

  recriarColaborador(colaborador: Colaborador): Colaborador {
    return JSON.parse(JSON.stringify(colaborador));
  }

  adicionarColaboradorSelecionado(): void {
    if (
      this.buscaColaboradoresComponent &&
      this.buscaColaboradoresComponent.colaborador
    ) {
      const colaborador = this.recriarColaborador(
        this.buscaColaboradoresComponent.colaborador
      );
      const ultimoId =
        this.listaColaboradores.length > 0
          ? Math.max(...this.listaColaboradores.map((c) => c.id || 0))
          : 0;
      colaborador.id = ultimoId + 1;
      this.listaColaboradores.push(colaborador);
      this.colaboradorSelecionado = colaborador;
      this.preencherLancamentosDoColaboradorSelecionado();
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

  verificaSaldoNegativo(desvio: string): boolean {
    return desvio.includes('-') && desvio.includes(':');
  }

  inicializarFiltroData(colaborador: Colaborador): void {
    this.colaboradorSelecionado = colaborador;
    this.colaboradorSelecionado.validandoCampos = true;
    this.erroNasDatas = false;

    if (
      this.colaboradorSelecionado.projetoSelecionado &&
      this.colaboradorSelecionado.tipoAlocacaoSelecionado
    )
      this.apresentarFiltroData = true;
  }

  inicializarPreenchimento(colaborador: Colaborador): void {
    this.colaboradorSelecionado = colaborador;
    this.erroNasDatas = false;
    this.dataInicioMinimaPreenchimento = this.retornaDataMinimaPreenchimento();
    this.dataFinalMaximaPreenchimento = this.retornaDataMaximaPreenchimento();

    this.apresentarPreenchimento = true;
  }

  aplicarPreenchimento(): void {
    const colaboradorDaLista = this.listaColaboradores.find(
      (f) => f.id == this.colaboradorSelecionado.id
    );

    if (this.dataInicioPreenchimento && this.dataFinalPreenchimento) {
      this.erroNasDatas = !this.validarDataInicioAntesDaDataFim(
        this.dataInicioPreenchimento,
        this.dataFinalPreenchimento
      );
    }
    if (colaboradorDaLista && !this.erroNasDatas) {
      colaboradorDaLista.lancamentos.forEach((lancamento) => {
        const dataLancamento = this.stringParaDate(lancamento.DData);
        if (
          this.validaEdicaoLancamento(lancamento.DData) &&
          (!this.dataInicioPreenchimento ||
            dataLancamento >= this.dataInicioPreenchimento) &&
          (!this.dataFinalPreenchimento ||
            dataLancamento <= this.dataFinalPreenchimento)
        )
          lancamento.ATipoLancamento = this.alocacaoSelecionada;
      });
    }
    this.apresentarPreenchimento = this.erroNasDatas;
  }

  copiarColaborador(colaborador: Colaborador): void {
    this.colaboradorCopiado = JSON.parse(JSON.stringify(colaborador));
  }

  colarColaborador(colaborador: Colaborador): void {
    colaborador.projetoSelecionado = this.colaboradorCopiado.projetoSelecionado;
    colaborador.tipoAlocacaoSelecionado =
      this.colaboradorCopiado.tipoAlocacaoSelecionado;
    colaborador.lancamentos = this.colaboradorCopiado.lancamentos.filter((f) =>
      this.validaEdicaoLancamento(f.DData)
    );
  }

  emitirColaborador(): void {
    this.colaboradorEmitter.emit(this.colaboradorParaBusca);
  }

  notificarErro(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
      life: 7000,
    });
  }

  limparFormulario(): void {
    this.listaColaboradores = [];
    this.listaColunas = [];
  }

  retornaDataMinimaPreenchimento(): Date {
    return this.colaboradorSelecionado &&
      (this.colaboradorSelecionado.lancamentos?.length || 0) > 0
      ? this.stringParaDate(this.colaboradorSelecionado.lancamentos[0].DData)
      : new Date();
  }

  retornaDataMaximaPreenchimento(): Date {
    return this.colaboradorSelecionado &&
      (this.colaboradorSelecionado.lancamentos?.length || 0) > 0
      ? this.stringParaDate(
          this.colaboradorSelecionado.lancamentos[
            this.colaboradorSelecionado.lancamentos?.length - 1
          ].DData
        )
      : new Date();
  }

  async buscarLancamentosDoColaborador(
    colaborador: Colaborador
  ): Promise<void> {
    this.colaboradorSelecionado = colaborador;
    this.colaboradorSelecionado.validandoCampos = true;
    this.erroNasDatas = false;

    if (
      this.colaboradorSelecionado.projetoSelecionado &&
      this.colaboradorSelecionado.tipoAlocacaoSelecionado
    )
      await this.buscaLancamentos();
  }

  aplicarFiltroData(): void {
    if (this.dataInicio || this.dataFinal) {
      if (this.dataInicio && !this.dataFinal) {
        this.dataFinal = new Date();
        this.dataFinal.setDate(this.dataInicio.getDate() + 30);
      } else if (!this.dataInicio && this.dataFinal) {
        this.dataInicio = new Date();
        this.dataInicio.setDate(this.dataFinal.getDate() - 30);
      }

      if (this.dataInicio && this.dataFinal) {
        this.erroNasDatas = !this.validarDataInicioAntesDaDataFim(
          this.dataInicio,
          this.dataFinal
        );

        if (!this.erroNasDatas) {
          if (
            this.calcularDistanciaEmDias(this.dataInicio, this.dataFinal) > 60
          ) {
            this.dataFinal.setDate(this.dataInicio.getDate() + 60);
          }
          this.preencherListaColunasPorPeriodo();
        }
      } else this.preencherListaColunasPorPeriodo();

      this.listaColaboradores.forEach((colaborador) => {
        this.colaboradorSelecionado = colaborador;
        this.preencherLancamentosDoColaboradorSelecionado();
      });
    }
    this.apresentarFiltroData = this.erroNasDatas;
  }

  calcularDistanciaEmDias(dataInicio: Date, dataFim: Date): number {
    const diffMs = dataFim.getTime() - dataInicio.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  preencherListaColunasPorPeriodo(): void {
    if (!this.dataInicio || !this.dataFinal) {
      this.listaColunas = [];
      return;
    }
    const dias = eachDayOfInterval({
      start: this.dataInicio,
      end: this.dataFinal,
    });
    this.listaColunas = dias.map((dia) => format(dia, 'dd/MM/yyyy'));
  }

  obterTipoLancamento(colaborador: Colaborador, data: string): Lancamento {
    if (!colaborador.lancamentos) return { DData: data, ATipoLancamento: null };
    const lanc = colaborador.lancamentos.find((l) => l.DData === data);
    return lanc || { DData: data, ATipoLancamento: null };
  }

  gravarTipoLancamento(
    colaborador: Colaborador,
    data: string,
    tipoLancamento: string
  ): void {
    const lanc = colaborador.lancamentos.find((l) => l.DData === data);
    if (lanc) lanc.ATipoLancamento = tipoLancamento;
  }

  filtrarProjetos(event: Event): Projeto[] {
    const query = (event as CustomEvent).detail.query.toLowerCase();
    return this.listaProjetos.filter((proj) =>
      proj.ANome.toLowerCase().includes(query)
    );
  }

  preencherLancamentosDoColaboradorSelecionado(): void {
    if (!this.colaboradorSelecionado || !this.listaColunas) return;
    if (!this.colaboradorSelecionado.lancamentos) {
      this.colaboradorSelecionado.lancamentos = [];
    }

    this.listaColunas.forEach((dataStr) => {
      const existe = this.colaboradorSelecionado.lancamentos.some(
        (lanc) => lanc.DData === dataStr
      );
      if (!existe) {
        this.colaboradorSelecionado.lancamentos.push({
          DData: dataStr,
          ATipoLancamento: null,
        });
      }
    });
  }

  validaEdicaoLancamento(data: string | Date): boolean {
    const dataHoje = new Date();
    dataHoje.setHours(0, 0, 0, 0);
    return typeof data === 'string'
      ? this.stringParaDate(data) >= dataHoje
      : data >= dataHoje;
  }

  validarDataInicioAntesDaDataFim(dataInicio: Date, dataFim: Date): boolean {
    return dataInicio <= dataFim;
  }

  excluirColaboradorPorId(id: number): void {
    this.listaColaboradores = this.listaColaboradores.filter(
      (colab) => colab.id !== id
    );
  }

  verificarColaboradoresDuplicados(): number[] {
    const duplicados: number[] = [];
    const vistos = new Map<string, number[]>();

    this.listaColaboradores.forEach((colab) => (colab.duplicado = false));

    this.listaColaboradores.forEach((colab) => {
      const chave = `${colab.NMatricula}-${colab.projetoSelecionado?.NId}-${colab.tipoAlocacaoSelecionado}`;
      if (!vistos.has(chave)) {
        vistos.set(chave, []);
      }
      vistos.get(chave)!.push(colab.id);
    });

    vistos.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => {
          const colab = this.listaColaboradores.find((c) => c.id === id);
          if (colab) colab.duplicado = true;
          duplicados.push(id);
        });
      }
    });

    if (duplicados.length > 0)
      this.notificarErro('Existem colaboradores duplicados.');
    return duplicados;
  }

  validarCamposColaboradores(): boolean {
    let valido = true;
    this.listaColaboradores.forEach((colab) => {
      colab.validandoCampos = true;

      valido =
        valido && !!colab.tipoAlocacaoSelecionado && !!colab.projetoSelecionado;
    });
    if (!valido) {
      this.notificarErro(
        'Todos os colaboradores devem ter projeto e tipo de alocação selecionados.'
      );
    }
    return valido;
  }

  retornaCorFeriadoFinalSemana(data: string): string {
    return this.retornaCorFinalSemana(data) || this.retornaCorFeriado(data);
  }

  retornaCorFeriado(data: string): string {
    let cor = '';
    this.feriados.forEach((feriado) => {
      if (feriado.data === data) {
        cor = 'lightblue';
      }
    });
    return cor;
  }

  retornaCorFinalSemana(dataStr: string): string {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const diaSemana = data.getDay(); // 0 = domingo, 6 = sábado

    if (diaSemana === 0 || diaSemana === 6) {
      return 'lightblue';
    }
    return '';
  }

  retornaCorConformeSigla(
    colaborador: Colaborador,
    dataColuna: string
  ): string {
    const lancamento = this.obterTipoLancamento(colaborador, dataColuna);
    const legenda = this.listaLegendas.find(
      (l) => l.sigla === lancamento.ATipoLancamento
    );
    return legenda ? legenda.cor : 'color: black;';
  }

  retornaListaLegendasParaTela(): LegendaSiglas[] {
    return this.listaLegendas.filter((f) => f.sigla !== 'FS');
  }

  criaListaLegendaSiglas(): void {
    this.listaLegendas = [
      {
        descricao: 'Atividade de campo confirmada',
        sigla: 'Cam',
        formatacao: 'Fonte verde negrito',
        cor: 'color: green; font-weight: bold;',
      },
      {
        descricao: 'Atividade de escritório confirmada',
        sigla: 'Esc',
        formatacao: 'Fonte verde negrito',
        cor: 'color: green; font-weight: bold;',
      },
      {
        descricao: 'Atividade de campo planejada/ a confirmar',
        sigla: 'CamP',
        formatacao: 'Fonte em vermelho',
        cor: 'color: red;',
      },
      {
        descricao: 'Atividade de escritório planejada/ a confirmar',
        sigla: 'EscP',
        formatacao: 'Fonte em vermelho',
        cor: 'color: red;',
      },
      {
        descricao: 'Compensação de Horas',
        sigla: 'CH',
        formatacao: 'Fonte em preto/padrão',
        cor: 'color: black;',
      },
      {
        descricao: 'Férias',
        sigla: 'Fe',
        formatacao: 'Fonte em preto/padrão',
        cor: 'color: black;',
      },
      {
        descricao: 'Não agendar campo',
        sigla: 'P',
        formatacao: 'Fonte em preto/padrão',
        cor: 'color: black;',
      },
      {
        descricao: 'Licença Médica/Maternidade',
        sigla: 'LM',
        formatacao: 'Fonte em preto/padrão',
        cor: 'color: black;',
      },
      {
        descricao: 'Feriados Municipais e Estaduais',
        sigla: 'FD',
        formatacao: 'Fonte em preto e preenchimento em cinza',
        cor: 'color: black; background-color: gray;',
      },
      {
        descricao: 'Final de Semana (sábado ou domingo)',
        sigla: 'FS',
        formatacao: 'Fonte em preto e preenchimento em cinza',
        cor: 'color: black; background-color: gray;',
      },
      {
        descricao: 'Recesso Sete',
        sigla: 'RS',
        formatacao: 'Fonte em preto e preenchimento em cinza',
        cor: 'color: black; background-color: gray;',
      },
      {
        descricao: 'Descanso Semanal Remunerado',
        sigla: 'DSR',
        formatacao: 'Fonte em preto e preenchimento em cinza',
        cor: 'color: black; background-color: gray;',
      },
    ];
  }

  enviar(): void {
    if (
      this.validarCamposColaboradores() &&
      this.verificarColaboradoresDuplicados().length < 1
    )
      this.enviarSolicitacao.emit(true);
  }
}
