import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MessageService, Message } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Apontamento } from '../../services/models/apontamento';
import { Colaborador } from '../../services/models/colaborador.model';
import { Projeto } from '../../services/models/projeto.model';

@Component({
  selector: 'app-colaboradores-vinculados',
  templateUrl: './colaboradores-vinculados.component.html',
  styleUrls: ['./colaboradores-vinculados.component.css'],
  standalone: true,
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
  ],
  providers: [MessageService],
})
export class ColaboradoresVinculadosComponent implements OnInit {
  @Output()
  enviarSolicitacao: EventEmitter<boolean> = new EventEmitter<boolean>();

  public informacoesColaborador = input<Colaborador | undefined>(undefined);
  formApontamento!: FormGroup;
  projetoSelecionado!: Projeto;
  colaborador!: Colaborador;
  listaApontamentosAtual: Apontamento[] = [];
  data!: any;
  desabilitar: boolean = false;
  mensagemErroSomatoria: Message[] = [
    {
      severity: 'error',
      detail:
        'A somatória de apontamentos não pode ultrapassar a quantidade de horas previstas para esse dia.',
    },
  ];
  mensagemErroAfastamento: Message[] = [
    {
      severity: 'error',
      detail:
        'O colaborador estava afastado nesse dia, por tanto, não poderá apontar nele.',
    },
  ];
  mensagemErroMesmoProjeto: Message[] = [
    {
      severity: 'error',
      detail:
        'Não é possivel selecionar o mesmo projeto mais de uma vez, remova ou faça a alteração.',
    },
  ];
  mensagemErroMarcacoesInpares: Message[] = [
    {
      severity: 'error',
      detail:
        'Marcações impares, favor revisar as marcações de ponto neste dia.',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.formApontamento = this.fb.group({
      periodo: [{ value: '', disabled: false }, Validators.required],
      dataAcerto: [{ value: '', disabled: false }, Validators.required],
      apontamentos: this.fb.array([]),
    });
  }

  enviar(): void {
    if (this.validarEnvio()) this.enviarSolicitacao.emit(true);
  }

  validarEnvio(): boolean {
    if (!this.data) {
      this.notificar('É obriatorio informar a data do apontamento');
      return false;
    }

    if (this.listaApontamentosAtual.length < 1) {
      this.notificar('É obriatorio adicionar ao menos um apontamento');
      return false;
    }

    this.validarAlterqacaoNoApontamento();
    if (
      this.listaApontamentosAtual.filter(
        (f) => f.incluido || f.alterado || f.excluido
      ).length < 1
    ) {
      this.notificar('É obriatorio ter alguma alteração nos apontamentos');
      return false;
    }

    if (
      this.listaApontamentosAtual.filter(
        (f) => !f.NCodigoProjeto || f.NQuantidade == '0'
      ).length > 0
    ) {
      this.notificar(
        'As informações de projetos e quantidade de horas devem ser preenchidas e diferentes de zero'
      );
      return false;
    }

    return (
      !this.validarTotalHoras() &&
      !this.validarDataAfastado() &&
      !this.validarProjetoRepetido() &&
      !this.validarmarcacoesImpares()
    );
  }

  notificar(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
    });
  }

  limparFormulario(): void {
    this.data = null;
    this.listaApontamentosAtual = [];
  }

  preencherColaborador(colaborador: Colaborador): void {
    this.limparFormulario();
    this.colaborador = colaborador;
  }

  labelProjeto(codigoProjeto: string): string {
    return codigoProjeto;
  }

  selecionarData(data: any): void {
    this.formApontamento?.get('dataAcerto')?.setValue(data.value);
    this.data = data.value;
    this.listaApontamentosAtual = JSON.parse(
      JSON.stringify(this.data?.apontamentos || [])
    );
    this.inicializacaoListaApontamentosAtual();
  }

  inicializacaoListaApontamentosAtual(): void {
    this.listaApontamentosAtual.forEach((apontamento) => {
      apontamento.alterado = false;
      apontamento.excluido = false;
      apontamento.quantidadeHoras = this.converteMinutosStringParaDate(
        Number(apontamento.NQuantidade)
      );
      apontamento.quantidadeFormatado = this.converteMinutosParaString(
        Number(apontamento.NQuantidade)
      );
    });
  }

  converteMinutosStringParaDate(minutos: number): Date {
    const data = new Date();
    if (minutos) {
      data.setHours(Math.floor(minutos / 60));
      data.setMinutes(minutos / 60 - Math.floor(minutos / 60));
    } else {
      data.setHours(0);
      data.setMinutes(0);
    }
    return data;
  }

  converteMinutosParaString(minutos: number): string {
    const minutes = minutos % 60;
    const hours = Math.floor(minutos / 60);
    return (
      (hours > 9 ? hours.toString() : '0' + hours.toString()) +
      ':' +
      (minutes > 9 ? minutes.toString() : '0' + minutes.toString())
    );
  }

  converteMinutos(data: Date): number {
    return data.getHours() * 60 + data.getMinutes();
  }

  adicioanrLinha(): void {
    this.listaApontamentosAtual.push({
      NCodigoProjeto: '',
      NQuantidade: '0',
      quantidadeHoras: this.converteMinutosStringParaDate(0),
      quantidadeFormatado: this.converteMinutosParaString(0),
      incluido: true,
    });
  }

  botaoExcluir(index: number): void {
    this.listaApontamentosAtual.splice(index, 1);
  }

  botaoExcluirExistente(index: number): void {
    this.listaApontamentosAtual[index].excluido =
      !this.listaApontamentosAtual[index].excluido;
  }

  atulizarFormatacaoQuantidadeHoras(index: number): void {
    this.listaApontamentosAtual[index].NQuantidade = this.converteMinutos(
      this.listaApontamentosAtual[index].quantidadeHoras
    ).toString();
    this.listaApontamentosAtual[index].quantidadeFormatado =
      this.converteMinutosParaString(
        Number(this.listaApontamentosAtual[index].NQuantidade)
      );
  }

  validarTotalHoras(): boolean {
    let totalHoras = 0;
    if (this.listaApontamentosAtual.length > 0) {
      this.listaApontamentosAtual
        .filter((f) => !f?.excluido)
        .forEach((apontamento) => {
          totalHoras += Number(apontamento?.NQuantidade || 0);
        });
    }
    return totalHoras > 600;
  }

  validarDataAfastado(): boolean {
    return this.data && this.data?.AAfastado == 'S';
  }

  validarmarcacoesImpares(): boolean {
    return this.data && Number(this.data?.NQuantidadeBatidas) % 2 !== 0;
  }

  validarProjetoRepetido(): boolean {
    const vistos: Set<string> = new Set();

    for (const apontamento of this.listaApontamentosAtual.filter(
      (f) => !f.excluido
    )) {
      if (
        apontamento.NCodigoProjeto &&
        vistos.has(apontamento.NCodigoProjeto)
      ) {
        return true;
      }
      vistos.add(apontamento.NCodigoProjeto);
    }

    return false;
  }

  validarAlterqacaoNoApontamento(): void {
    if (this.data.apontamentos)
      this.data.apontamentos.forEach(
        (apontamentoAntigo: Apontamento, index: number) => {
          const apontamentoNovo = this.listaApontamentosAtual[index];
          if (!apontamentoNovo.excluido) {
            this.listaApontamentosAtual[index].alterado =
              apontamentoAntigo.NCodigoProjeto !=
                apontamentoNovo.NCodigoProjeto ||
              apontamentoAntigo.NQuantidade != apontamentoNovo.NQuantidade;
          }
        }
      );
  }

  desabilitarForm(habilitar: boolean): void {
    this.desabilitar = habilitar;
  }
}
