import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { finalize, firstValueFrom, lastValueFrom } from 'rxjs';

import { CalendarModule } from 'primeng/calendar';

import { InformacoesColaboradorService } from './services/informacoes-colaborador.service';
import { Colaborador } from './services/models/colaborador.model';

import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { Apontamento } from './services/models/apontamento';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DadosProjetoComponent } from './components/dados-projeto/dados-projeto.component';
import { ColaboradoresVinculadosComponent } from './components/colaboradores-vinculados/colaboradores-vinculados.component';
import { Projeto } from './services/models/projeto.model';

@Component({
  selector: 'app-historicos-colaborador',
  standalone: true,
  imports: [
    FormsModule,
    DadosProjetoComponent,
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

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  protected informacoesColaborador = signal<Colaborador | undefined>(undefined);
  carregandoInformacoes = signal(false);

  listaProejtos!: Projeto[];

  constructor(private messageService: MessageService) {}

  async ngOnInit(): Promise<void> {
    await this.inicializaComponente();
  }

  async inicializaComponente(): Promise<void> {
    this.carregandoInformacoes.set(true);
    await this.buscaProjetos();
    this.dadosProjetoComponent.preencheListaProejtos(this.listaProejtos);
    this.carregandoInformacoes.set(false);
  }

  async buscaProjetos(): Promise<void> {
    try {
      const projetos = await firstValueFrom(
        this.informacoesColaboradorService.obterListaProjetos()
      );
      if (projetos.outputData.message || projetos.outputData.ARetorno != 'OK') {
        this.notificarErro(
          'Erro ao buscar a lista de projetos, ' +
            (projetos.outputData.message || projetos.outputData.ARetorno)
        );
      } else this.listaProejtos = projetos.outputData.projetos;
    } catch (error) {
      console.error(error);
      this.notificarErro(
        'Erro ao buscar a lista de projetos, tente mais tarde ou contate o admnistrador. ' +
          error
      );
    }
  }

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
    await this.gravarEnvio();
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
}
