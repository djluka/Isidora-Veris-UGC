const clientsContent = [
  {
    title: "Shelly’s Smash Burgers",
    desc: `Predstavljanje proizvoda realnom pričom, autentičnim snimcima,
                vizualima i efektima za privlačenje pažnje gledaoca`,
    video: "/assets/videos/copy_0127BC5C-4AA3-4E59-AEF3-9AD6FFF660DE.MP4",
  },
];

const content = clientsContent.map(clientContent => {
    return `            <div class="clients_card">
              <video
                src="${clientContent.video}"
                muted
                autoplay
                playsinline
                loop
              ></video>
              <p>${clientContent.title}</p>
              <p>${clientContent.desc}</p>
            </div>`
})

console.log(content)