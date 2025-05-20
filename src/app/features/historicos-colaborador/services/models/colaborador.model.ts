import { DataApontamento } from './data-apontamento';
import { Lancamento } from './lancamento';
import { Projeto } from './projeto.model';

export interface Colaborador {
  NEmpresa: string;
  NTipoColaborador: string;
  NMatricula: string;
  ANome: string;
  projetos: Projeto[];
  projetoSelecionado: Projeto;
  tipoAlocacaoSelecionado: string;
  lancamentos: Lancamento[];
  validandoCampos: boolean;
}

export class RetornoColaborador {
  outputData: {
    colaboradores: Colaborador[];
    ARetorno?: string;
    message?: string;
  };

  constructor() {
    this.outputData = { colaboradores: [] };
  }
}
