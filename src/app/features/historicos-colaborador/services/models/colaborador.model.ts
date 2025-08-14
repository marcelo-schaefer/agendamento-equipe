import { Lancamento } from './lancamento';
import { Projeto } from './projeto.model';

export interface Colaborador {
  id: number;
  NEmpresa: string;
  NTipoColaborador: string;
  NMatricula: string;
  ANome: string;
  projetos: Projeto[];
  projetoSelecionado: Projeto;
  tipoAlocacaoSelecionado: string;
  lancamentos: Lancamento[];
  validandoCampos: boolean;
  duplicado: boolean;
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
