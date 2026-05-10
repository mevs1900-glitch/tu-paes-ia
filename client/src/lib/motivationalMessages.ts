export function getMotivationalMessage(currentIndex: number, total: number): string {
  const percentage = (currentIndex / total) * 100;

  if (percentage < 33) {
    const messages = ["Vas bien", "Empezaste fuerte", "Adelante"];
    return messages[Math.floor(Math.random() * messages.length)];
  } else if (percentage < 66) {
    const messages = ["Sigue así", "Vas muy bien", "Ya casi"];
    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    const messages = ["Ya casi", "Casi terminas", "Ultimo esfuerzo"];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export function getResultMessage(percentage: number): string {
  if (percentage >= 90) {
    return "¡Perfecto!";
  } else if (percentage >= 80) {
    return "¡Excelente!";
  } else if (percentage >= 70) {
    return "¡Muy bien!";
  } else if (percentage >= 60) {
    return "¡Bien!";
  } else {
    return "Sigue intentando";
  }
}
