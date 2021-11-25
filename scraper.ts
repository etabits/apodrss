import { readFile } from 'fs/promises'
import { JSDOM } from 'jsdom'
import axios from 'axios';

const baseUrl = 'https://apod.nasa.gov/apod/'

export async function index() {
  const page = (await axios.get('https://apod.nasa.gov/apod/archivepix.html'))
  // console.log(html.)
  // const html = await readFile('/tmp/apodrss/archivepix.html', 'utf-8')
  const links = [...new JSDOM(page.data).window.document
    .querySelectorAll('a')]
    .filter(a => a.getAttribute('href').match(/^ap\d{6}\.html$/))
    .slice(0, 60)
    .map(a => ({
      title: a.textContent.trim(),
      href: a.getAttribute('href'),
    }))
  return links
}

export async function day(fname: string) {
  const url = new URL(fname, baseUrl).toString()
  // const html = await readFile('/tmp/apodrss/ap211124.html', 'utf-8')
  const page = await axios.get(url)
  const document = new JSDOM(page.data).window.document
  // console.log('>>>', document.body.outerHTML)
  const pageTitle = document.querySelector('title').textContent.trim()

  const [cImg, cTitleCred, _cFooter] = document.querySelectorAll('body > center')

  const date = new Date(parseInt('20' + fname.substring(2, 4)),
    parseInt(fname.substring(4, 6)) - 1,
    parseInt(fname.substring(6, 8)),
    7, 0, 0) // Gotta FIXME timezone, or get file info from remote file
  // console.log(cTitleCred, document.querySelectorAll('center'))

  const image = await extractImageUrl(cImg)
  // console.log(fname, image)
  // console.log(image, !!img)
  return {
    pageTitle,
    date,
    url,
    image,
    title: cTitleCred.querySelector('b').textContent.trim(),
    body: document.querySelector('body > p').innerHTML.trim(),
  }
}

async function extractImageUrl(cImg: Element) {
  const img = cImg.querySelector('img')
  if (img) {
    return new URL(img.getAttribute('src'), baseUrl).toString()
  }
  const src = cImg.querySelector('iframe').getAttribute('src')
  if (src.includes('youtube')) {
    return `https://img.youtube.com/vi/${src.match(/embed\/(.{11})/).pop()}/sddefault.jpg`
  }
  const vimeoUrl = `http://vimeo.com/api/v2/video/${src.match(/player\.vimeo\.com\/video\/(\d+)/).pop()}.json`;
  const vimeoData = await axios.get(vimeoUrl)
  // console.log(vimeoData.data)
  return vimeoData.data[0].thumbnail_medium
}