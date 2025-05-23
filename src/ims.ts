const tryAddButtons = async () => {
  const pageLabel = document.getElementById("LblPage")
  if (!pageLabel) {
    return
  }
  if (pageLabel.textContent?.trim() !== "קורסים וציונים") {
    return
  }

  const s = (
    Array.from(document.getElementsByName("lstSem"))[0] as HTMLSelectElement
  )?.value

  if (!s) {
    return
  }

  const year = (parseInt(s.slice(0, 4), 10) + 1).toString()
  const semester = year + SEMESTER_MAP[s[4]]
  const data = await chrome.runtime.sendMessage({ type: "getData", semester })

  for (const table of Array.from(document.getElementsByTagName("table"))) {
    for (const tr of Array.from(table.getElementsByTagName("tr"))) {
      if (tr.childElementCount === 13) {
        const td = document.createElement("td")
        if (tr.childNodes[0].textContent?.trim() === "סמס") {
          // header row
          td.innerText = "הוסף ל-TAU Refactor"
          tr.appendChild(td)
        } else {
          const courseId = tr.childNodes[1].textContent!.replace("-", "")
          const thisSemester =
            year +
            HEBREW_TO_ENGLISH_SEMESTER[tr.childNodes[0].textContent!.trim()!]
          if (data[thisSemester][courseId]) {
            td.innerHTML = "כבר נוסף!"
            td.style.textAlign = "center"
            tr.appendChild(td)
            continue
          } else if (!tr.childNodes[12].hasChildNodes()) {
            tr.appendChild(td)
            continue
          }

          // body row
          const addButton = document.createElement("button")
          addButton.style.width = "100%"
          addButton.style.border = "none"
          addButton.style.backgroundColor = "rgb(19, 152, 255)"
          addButton.style.color = "white"
          addButton.style.cursor = "pointer"
          addButton.style.borderRadius = "10px"
          addButton.innerText = "הוסף"
          addButton.onclick = async (e) => {
            const hiddenIframe = document.createElement("iframe")
            hiddenIframe.style.display = "none"
            hiddenIframe.name = "hidden-iframe"
            document.body.appendChild(hiddenIframe)
            e.preventDefault()
            const frmchart = Array.from(
              document.getElementsByName("frmchart")
            )[0] as HTMLFormElement
            frmchart.target = "hidden-iframe"
            await chrome.runtime.sendMessage({
              type: "setShouldSendData",
              shouldSendData: true,
            })
            const radio = tr.childNodes[12].childNodes[0] as HTMLInputElement
            radio.click()
            radio.checked = false
            addButton.style.display = "none"
            setTimeout(() => {
              document.body.removeChild(hiddenIframe)
              window.location.reload()
            }, 5000)
          }
          td.appendChild(addButton)
          tr.appendChild(td)
        }
      } else if (
        tr.childElementCount === 1 &&
        tr.getElementsByTagName("td")[0].colSpan === 13
      ) {
        tr.getElementsByTagName("td")[0].colSpan = 14
      }
    }
  }
}

const SEMESTER_MAP: Record<string, string> = {
  "1": "a",
  "2": "b",
  "3": "summer",
  "4": "all_year",
  "9": "all_year",
}

const HEBREW_TO_ENGLISH_SEMESTER: Record<string, string> = {
  א: "a",
  ב: "b",
}

const tryGetData = async () => {
  const shouldSendData = await chrome.runtime.sendMessage({
    type: "shouldSendData",
  })
  if (!shouldSendData) {
    return
  }

  const maps = Array.from(document.getElementsByTagName("map"))
  const courseInfo = document.querySelector("div.rounddiv2.listtd")
  const lstKv = Array.from(
    document.getElementsByName("lstKv")
  )[0] as HTMLSelectElement
  const lstMoed = Array.from(
    document.getElementsByName("lstMoed")
  )[0] as HTMLSelectElement
  const tableSecondRow = document.querySelector(
    "table.table.rounddiv > tbody > tr:nth-child(2)"
  )
  const showButton = Array.from(document.getElementsByName("btnshow"))[0]

  if (!lstKv || !lstMoed || !showButton) {
    return
  }

  let response: any
  const group = lstKv.value === "" ? "00" : lstKv.value
  const moed = lstMoed.value === "9" ? "0" : lstMoed.value
  const groupOptions = Array.from(lstKv.options).map((option) =>
    option.value === "" ? "00" : option.value
  )
  const moedOptions = Array.from(lstMoed.options).map((option) =>
    option.value === "9" ? "0" : option.value
  )

  if (
    maps.length !== 1 ||
    !courseInfo ||
    !courseInfo.textContent ||
    !tableSecondRow
  ) {
    response = await chrome.runtime.sendMessage({
      type: "sendData",
      groupOptions,
      moedOptions,
      group,
      moed,
    })
  } else {
    const tableElements = Array.from(tableSecondRow.getElementsByTagName("td"))

    const split = courseInfo.textContent.split(" ")
    const courseId = split[1].split("-")[0]
    const s = split[split.length - 1]
    const semester =
      (parseInt(s.slice(0, 4), 10) + 1).toString() + SEMESTER_MAP[s[5]]
    const mean = parseFloat(tableElements[1].textContent!)
    const median = parseInt(tableElements[3].textContent!, 10)
    const standardDeviation = parseFloat(tableElements[5].textContent!)

    const map = maps[0]
    const distribution: number[] = []
    for (const area of Array.from(map.getElementsByTagName("area"))) {
      const title = area.title
      const count = parseInt(title.split(" ")[1], 10)
      distribution.push(count)
    }
    response = await chrome.runtime.sendMessage({
      type: "sendData",
      groupOptions,
      moedOptions,
      group,
      moed,
      courseId,
      semester,
      distribution,
      mean,
      median,
      standardDeviation,
    })
  }

  if (response.type === "setGroupAndMoed") {
    lstKv.value = response.group
    lstMoed.value = response.moed
    showButton.click()
  } else if (response.type === "finish") {
    window.close()
  }
}

tryAddButtons()
tryGetData()
