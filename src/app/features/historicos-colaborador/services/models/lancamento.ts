export class Lancamento {
  DData: string;
  ATipoLancamento: string;
}

export class RetornoLancamento {
  outputData: {
    colaboradores: RetornoLancamento[];
    message?: string;
  };
}
