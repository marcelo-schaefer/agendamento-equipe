import { DataApontamento } from './data-apontamento';
import { Projeto } from './projeto.model';

export interface Colaborador {
  NEmpresa: string;
  NTipoColaborador: string;
  NMatricula: string;
  ANome: string;
  projetos: Projeto[];
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
