import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  fromEvent,
  map,
  Observable,
  of,
  tap,
  timeout,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  token$ = new BehaviorSubject<Token | undefined>(undefined);
  username = '';

  carregarToken(): Promise<void> {
    return firstValueFrom(this.obterToken()).then((): void => void 0);
  }

  obterToken(): Observable<Token> {
    const token = this.token$.getValue();

    return token !== undefined
      ? of(token)
      : fromEvent(window, 'message').pipe(
          timeout(5000),
          map<any, Token>((evento) => {
            console.log(evento);
            this.username = (evento.data?.token?.username || '').split('@')[0];
            return {
              accessToken: evento.data.token.access_token,
              tokenType: evento.data.token.token_type,
            };
          }),
          tap((token) => {
            this.token$.next(token);
          })
        );
  }
}

export interface Token {
  accessToken: string;
  tokenType: string;
}
