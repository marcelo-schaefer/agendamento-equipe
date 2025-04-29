import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { finalize, lastValueFrom } from 'rxjs';

import { CalendarModule } from 'primeng/calendar';

import { InformacoesColaboradorService } from './services/informacoes-colaborador.service';
import { Colaborador } from './services/models/colaborador.model';

import { InformacoesColaboradorComponent } from './components/informacoes-colaborador/informacoes-colaborador.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FormsModule } from '@angular/forms';
import { ApontamentoHorasComponent } from './components/apontamento-horas/apontamento-horas.component';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { Apontamento } from './services/models/apontamento';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DadosProjetoComponent } from './components/dados-projeto/dados-projeto.component';
import { ColaboradoresVinculadosComponent } from './components/colaboradores-vinculados/colaboradores-vinculados.component';

@Component({
  selector: 'app-historicos-colaborador',
  standalone: true,
  imports: [
    FormsModule,
    InformacoesColaboradorComponent,
    DadosProjetoComponent,
    ApontamentoHorasComponent,
    ColaboradoresVinculadosComponent,
    LoadingComponent,
    CalendarModule,
    ToastModule,
    ProgressSpinnerModule,
    RippleModule,
  ],
  providers: [MessageService],
  templateUrl: './historicos-colaborador.component.html',
  styleUrl: './historicos-colaborador.component.css',
})
export class HistoricosColaboradorComponent implements OnInit {
  @ViewChild(DadosProjetoComponent, { static: true })
  dadosProjetoComponent: DadosProjetoComponent | undefined;

  @ViewChild(ColaboradoresVinculadosComponent, { static: true })
  colaboradoresVinculadosComponent:
    | ColaboradoresVinculadosComponent
    | undefined;

  @ViewChild(ApontamentoHorasComponent, { static: true })
  apontamentoHorasComponent: ApontamentoHorasComponent | undefined;

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  protected informacoesColaborador = signal<Colaborador | undefined>(undefined);
  carregandoInformacoes = signal(false);

  public dataTeste = signal<Date | null>(null);
  solicitante!: Colaborador;

  constructor(private messageService: MessageService) {}

  async ngOnInit(): Promise<void> {
    await this.inicializaComponente();
  }

  async inicializaComponente(): Promise<void> {
    this.carregandoInformacoes.set(true);
    this.tratarDadosSolicitante();
    this.informacoesColaborador.set(this.solicitante);
    this.apontamentoHorasComponent?.preencherColaborador(this.solicitante);
    this.carregandoInformacoes.set(false);
  }

  tratarDadosSolicitante(): void {}

  notificarErro(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
    });
  }
  notificarSucesso(mensagem: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Erro',
      detail: mensagem,
    });
  }

  async enviarSolicitacao(): Promise<void> {
    this.carregandoInformacoes.set(true);
    this.apontamentoHorasComponent?.desabilitarForm(true);
    await this.gravarEnvio();
    this.apontamentoHorasComponent?.desabilitarForm(false);
  }

  async gravarEnvio(): Promise<void> {
    // await lastValueFrom(
    //   this.informacoesColaboradorService.gravarEnvio(this.montaCorpoEnvio())
    // ).then(
    //   (data) => {
    //     if (data.outputData.message || data.outputData.ARetorno != 'OK') {
    //       this.notificarErro(
    //         'Erro ao gravar os apontramentos, ' +
    //           (data.outputData?.message || data.outputData?.ARetorno)
    //       );
    //       this.carregandoInformacoes.set(false);
    //     } else {
    //       this.notificarSucesso('Gravado com sucesso!');
    //       this.inicializaComponente();
    //     }
    //   },
    //   () => {
    //     this.notificarErro(
    //       'Erro ao gravar os apontramentos, tente mais tarde ou contate o administrador'
    //     );
    //     this.carregandoInformacoes.set(false);
    //   }
    // );
  }

  // montaCorpoEnvio(): Persistencia {
  //   return {
  //     nEmpresa: Number(this.solicitante.NCodigoEmpresa),x
  //     nTipoColaborador: Number(this.solicitante.NTipoColaborador),
  //     nMatricula: Number(this.solicitante.NMatricula),
  //     dData: this.apontamentoHorasComponent?.data.DData,
  //     apontamentos: this.apontamentoHorasComponent?.listaApontamentosAtual
  //       .filter((f) => f.incluido || f.excluido)
  //       .map((apontamento) => {
  //         return {
  //           nCodigoProjeto: Number(apontamento.NCodigoProjeto),
  //           nQuantidade: Number(apontamento.NQuantidade),
  //           aTipo: apontamento.excluido ? 'E' : 'I',
  //         } as ApontamentosPersistencia;
  //       })
  //       .concat(
  //         this.retornaApontamentosAlterados()
  //       ) as ApontamentosPersistencia[],
  //   };
  // }

  // retornaApontamentosAlterados(): ApontamentosPersistencia[] {
  //   let apontamentos: ApontamentosPersistencia[] = [];
  //   this.apontamentoHorasComponent?.listaApontamentosAtual.forEach(
  //     (apontamento: Apontamento, index: number) => {
  //       if (apontamento.alterado)
  //         apontamentos.push({
  //           nCodigoProjeto: Number(
  //             this.apontamentoHorasComponent?.data.apontamentos[index]
  //               .NCodigoProjeto
  //           ),
  //           nQuantidade: Number(
  //             this.apontamentoHorasComponent?.data.apontamentos[index]
  //               .NQuantidade
  //           ),
  //           aTipo: 'E',
  //         });
  //     }
  //   );

  //   this.apontamentoHorasComponent?.listaApontamentosAtual.forEach(
  //     (apontamento: Apontamento) => {
  //       if (apontamento.alterado)
  //         apontamentos.push({
  //           nCodigoProjeto: Number(apontamento.NCodigoProjeto),
  //           nQuantidade: Number(apontamento.NQuantidade),
  //           aTipo: 'I',
  //         });
  //     }
  //   );

  //   return apontamentos;
  // }

  criarColaborador(): Colaborador {
    return {
      NCodigoEmpresa: '12345',
      ANomeEmpresa: 'Empresa Exemplo LTDA',
      NTipoColaborador: '1',
      ADescricaoTipoColaborador: 'Empregado',
      NMatricula: '123456',
      ANome: 'João da Silva',
      ARetorno: 'Sucesso',
      datasApontamento: [
        {
          DData: '20/12/2024',
          AAfastado: 'N',
          ABatidasPonto: '08:00 - 12:00, 13:00 - 17:00',
          NQuantidadeHorasPrevistas: '480',
          NQuantidadeBatidas: '4',
          apontamentos: [
            {
              NCodigoProjeto: '1',
              NQuantidade: '360',
            },
            {
              NCodigoProjeto: '2',
              NQuantidade: '60',
            },
          ],
        },
        {
          DData: '19/12/2024',
          AAfastado: 'S',
          ABatidasPonto: 'Não Apontado',
          NQuantidadeHorasPrevistas: '480',
          apontamentos: [],
        },
        {
          DData: '18/12/2024',
          AAfastado: 'N',
          ABatidasPonto: '07:00 - 12:12 - 13:30',
          NQuantidadeHorasPrevistas: '480',
          NQuantidadeBatidas: '3',
          apontamentos: [
            {
              NCodigoProjeto: '1',
              NQuantidade: '60',
            },
            {
              NCodigoProjeto: '2',
              NQuantidade: '120',
            },
          ],
        },
      ],
      projetos: [
        {
          NCodigoProjeto: '1',
          ADescricaoProjeto: 'Desenvolvimento de Sistema',
          nQuantidade: '10',
        },
        {
          NCodigoProjeto: '2',
          ADescricaoProjeto: 'Suporte Técnico',
          nQuantidade: '8',
        },
      ],
    } as unknown as Colaborador;
  }
}
