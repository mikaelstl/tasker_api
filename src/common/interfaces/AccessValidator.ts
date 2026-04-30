import { Resources } from "src/common/enums/Resources.enum";

export interface AccessValidator {
  /**
    Esta função deve verificar se o parametro subjectkey participa
    do objeto com id equivalente ao targetkey
 
    @param subjectkey Id do usuário logado
    @param targetkey Objeto a ser manipulado
  */
  participates?(subjectkey: string, targetkey: string): Promise<boolean>;

  /**
    Esta função deve verificar se o parametro subjectkey é dono
    do objeto  com id equivalente ao targetkey
 
    @param subjectkey Id do usuário logado
    @param targetkey Objeto a ser manipulado
  */
  belongs?(subjectkey: string, targetkey: string): Promise<boolean>;

  /**
    Esta função deve verificar se o parametro subjectkey gerencia
    do objeto com id equivalente ao targetkey
 
    @param subjectkey Id do usuário logado
    @param targetkey Objeto a ser manipulado
  */
  manage?(subjectkey: string, targetkey: string): Promise<boolean>;
}