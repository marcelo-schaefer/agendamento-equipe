export class Lancamento {
  DData: string;
  ATipoLancamento: string;
}

export class RetornoLancamento {
  outputData: {
    lancamentos: Lancamento[];
    message?: string;
  };
}
