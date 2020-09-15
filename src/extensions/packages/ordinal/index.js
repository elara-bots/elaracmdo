module.exports = (number) => {
  if (!Number.isInteger(number)) throw new Error('input must be an integer')
  if (number === 0) return '0';
  if (number >= 11 && number <= 13) return `${number.toString()}th`;
  switch (number.toString().slice(-1)) {
    case '1': return `${number.toString()}st`
    case '2': return `${number.toString()}nd`
    case '3': return `${number.toString()}rd`
    default : return `${number.toString()}th`
  };
}
