export class Lancamento {
  DData: string;
  ATipoLancamento: string;
  AFeriado?: string;
}

export class RetornoLancamento {
  outputData: {
    lancamentos: Lancamento[];
    message?: string;
  };
}
