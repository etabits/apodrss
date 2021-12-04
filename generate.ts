import { writeFile } from 'fs/promises'
import { Feed } from "feed";
import { day, index } from "./scraper";

const outFname = process.argv[2] || 'en'

const authors = [{
  name: "Robert Nemiroff (MTU)",
  link: "http://www.phy.mtu.edu/faculty/Nemiroff.html"
}, {
  name: "Jerry Bonnell (UMCP)",
  link: "https://antwrp.gsfc.nasa.gov/htmltest/jbonnell/www/bonnell.html",
}]

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
  author: {
    name: "Robert Nemiroff (MTU) & Jerry Bonnell (UMCP)",
    // email: "johndoe@example.com",
    link: "https://apod.nasa.gov/apod/lib/about_apod.html"
  },
});

console.log('getting latest index...')
index().then(async links => {
  console.log('getting pages, latest is: %s (%s)', links[0].title, links[0].href)
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
  const pagesBySlug = {}
  pages.forEach((page) => {
    const { title, link, slug, content, date, image, author, description } = page
    pagesBySlug[slug] = page
    feed.addItem({
      title,
      id: slug,
      guid: slug,
      link,
      content,
      date,
      image,
      contributor: author,
      description,
      author: [...author, ...authors],
    })
  })

  Object.entries({
    rss: feed.rss2(),
    atom: feed.atom1(),
    json: feed.json1()
  }).forEach(([ext, data]) => {
    const fname = outFname + '.' + ext;
    writeFile(fname, data).then(() => {
      console.log('wrote', fname)
    })
  })
})
