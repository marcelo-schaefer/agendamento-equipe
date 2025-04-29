import { Colaborador } from './colaborador.model';

export interface Persistencia {
  colaboradores: ColaboradoresPersistencia[];
}

export interface ColaboradoresPersistencia extends Colaborador {
  nEmpresa: number;
  nTipoColaborador: number;
  nMatricula: number;
  nHorasTotais: number;
  nCodigoProjeto: number;
}
