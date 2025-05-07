import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
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
import { BuscaColaboradoresComponent } from './components/busca-colaboradores/busca-colaboradores.component';
import {
  ColaboradoresPersistencia,
  Persistencia,
} from './services/models/persistencia';

@Component({
  selector: 'app-historicos-colaborador',
  standalone: true,
  imports: [
    FormsModule,
    DadosProjetoComponent,
    ColaboradoresVinculadosComponent,
    BuscaColaboradoresComponent,
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
export class HistoricosColaboradorComponent implements OnInit, AfterViewInit {
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
  projetoSelecionado!: Projeto;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.carregandoInformacoes.set(true);
    this.inicializaComponente();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.inicializarBuscaProjetos();
    this.carregandoInformacoes.set(false);
  }

  inicializaComponente(): void {
    this.dadosProjetoComponent.limparFormulario();
    this.colaboradoresVinculadosComponent.limparFormulario();
  }

  async inicializarBuscaProjetos(): Promise<void> {
    await this.buscaProjetos();
    this.tratarProjetos();
    this.dadosProjetoComponent.preencheListaProejtos(this.listaProejtos);
  }

  async reinicializarComponente(): Promise<void> {
    this.inicializaComponente();
    await this.inicializarBuscaProjetos();
  }

  tratarProjetos(): void {
    if (!Array.isArray(this.listaProejtos))
      this.listaProejtos = [this.listaProejtos];

    this.listaProejtos.forEach((proejto) => {
      if (proejto.colaboradores) {
        if (!Array.isArray(proejto.colaboradores))
          proejto.colaboradores = [proejto.colaboradores];
      } else {
        proejto.colaboradores = [];
      }
    });
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
      this.carregandoInformacoes.set(false);
    }
  }

  validarAdicaoColaborador(colaborador: Colaborador): void {
    if (
      this.colaboradoresVinculadosComponent
        .retornaListaColaboradoresTabela()
        .filter((f) => f.NMatricula == colaborador.NMatricula).length > 0
    )
      this.dadosProjetoComponent.apresentarErroColaboradorDuplicado(true);
    else
      this.colaboradoresVinculadosComponent.adicionarColaborador(colaborador);
  }

  receberProjetoSelecionado(projeto: Projeto): void {
    this.projetoSelecionado = projeto;
    this.colaboradoresVinculadosComponent.preencherProjetoSelecionado(
      this.projetoSelecionado
    );
  }

  notificarErro(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
      life: 10000,
    });
  }
  notificarSucesso(mensagem: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Erro',
      detail: mensagem,
      life: 10000,
    });
  }

  async enviarSolicitacao(): Promise<void> {
    this.desabilitarFormulario(true);
    this.carregandoInformacoes.set(true);
    await this.gravarEnvio();
    this.carregandoInformacoes.set(false);
    this.desabilitarFormulario(false);
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.dadosProjetoComponent.desabilitarFormulario(desabilitar);
    this.colaboradoresVinculadosComponent.desabilitarFormulario(desabilitar);
  }

  async gravarEnvio(): Promise<void> {
    await lastValueFrom(
      this.informacoesColaboradorService.gravarEnvio(this.montaCorpoEnvio())
    ).then(
      (data) => {
        if (data.outputData.message || data.outputData.ARetorno != 'OK') {
          this.notificarErro(
            'Erro ao gravar os colaboradores no projeto, ' +
              (data.outputData?.message || data.outputData?.ARetorno)
          );
          this.carregandoInformacoes.set(false);
        } else {
          this.notificarSucesso('Gravado com sucesso!');
          this.reinicializarComponente();
        }
      },
      () => {
        this.notificarErro(
          'Erro ao gravar os apontramentos, tente mais tarde ou contate o administrador'
        );
        this.carregandoInformacoes.set(false);
      }
    );
  }

  montaCorpoEnvio(): Persistencia {
    return {
      colaboradores:
        this.colaboradoresVinculadosComponent.colaboradoresAdicionados.map(
          (colab) => {
            return {
              nEmpresa: Number(colab.NEmpresa),
              nTipoColaborador: Number(colab.NTipoColaborador),
              nMatricula: Number(colab.NMatricula),
              nTotalHoras: Number(colab.NHorasTotais),
              nCodigoProjeto: Number(colab.nIdProjetoVinculado),
            } as ColaboradoresPersistencia;
          }
        ),
    };
  }

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
