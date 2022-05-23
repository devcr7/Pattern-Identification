import { words } from '../words'

export function getWordOfTheDay () {
  if (import.meta.env.DEV) {
    console.log('DEV: Answer is PRIDE')
    return { answer: 'pride', answerDay: 1 }
  }

  const now = dateToUtc(new Date())
  const start = new Date(Date.UTC(2022, 1, 15))
  const diff = Number(now) - Number(start)
  let day = Math.floor(diff / (1000 * 60 * 60 * 24))
  while (day > words.length) {
    day -= words.length
  }
  return { answer: words[day], answerDay: day + 1 }
}

function dateToUtc (d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
