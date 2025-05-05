import { DataApontamento } from './data-apontamento';
import { Projeto } from './projeto.model';

export interface Colaborador {
  NEmpresa: string;
  NTipoColaborador: string;
  NMatricula: string;
  ANome: string;
  NHorasTotais: string;
  NHorasApontadas: string;
  NDesvio: string;
  nIdProjetoVinculado?: string;
  incluido?: boolean;
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
