import { writeFile } from 'fs/promises'
import { Feed } from "feed";
import { day, index } from "./scraper";

const feed = new Feed({
  title: "APOD",
  description: "Astronomy Picture of the Day",
  id: "https://apod.nasa.gov/",
  link: "https://apod.nasa.gov/",
  language: "en",
  image: "https://apod.nasa.gov/favicon.ico",
  favicon: "https://apod.nasa.gov/favicon.ico",
  copyright: "APOD.nasa.gov",
  updated: new Date(),
  generator: "https://github.com/etabits/apodrss",
  // feedLinks: {
  //   json: "https://example.com/json",
  //   atom: "https://example.com/atom"
  // },
  // author: {
  //   name: "Robert Nemiroff (MTU) & Jerry Bonnell (UMCP)",
  //   email: "johndoe@example.com",
  //   link: "http://www.phy.mtu.edu/faculty/Nemiroff.html"
  // },
});

console.log('getting latest index...')
index().then(async links => {
  console.log('getting pages...')
  let i = 0;
  const pages = await Promise.all(links.map(link =>
    day(link.href)
      .then(l => {
        process.stdout.write(`\r[${++i}/${links.length}]`)
        return l
      })
      .catch(e => {
        console.error(e)
        console.error(link)
        throw e
      })
  ))
  console.log('writing rss file...')
  pages.forEach(page => {
    feed.addItem({
      title: page.title,
      id: page.url,
      link: page.url,
      content: page.body,
      date: page.date,
    })
  })

  writeFile('apod.rss', feed.rss2())
})
