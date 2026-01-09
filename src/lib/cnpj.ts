/**
 * Utilitários para formatação de CNPJ brasileiro
 */

/**
 * Aplica máscara de CNPJ brasileiro
 * @param value - Número de CNPJ (com ou sem formatação)
 * @returns CNPJ formatado: XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 14 dígitos
  const limitedNumbers = numbers.slice(0, 14);
  
  // Aplica a máscara baseado no tamanho
  if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 5) {
    return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2)}`;
  } else if (limitedNumbers.length <= 8) {
    return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5)}`;
  } else if (limitedNumbers.length <= 12) {
    return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}/${limitedNumbers.slice(8)}`;
  } else {
    // CNPJ completo: XX.XXX.XXX/XXXX-XX
    return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}/${limitedNumbers.slice(8, 12)}-${limitedNumbers.slice(12)}`;
  }
}



