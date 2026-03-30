


// Başlangıç
async function init(){
    newPoints(50);
    drawTrianglesAndEdges(0);
    drawBarcodeDynamic(0);

    // Backend’den persistence al
    const data = await fetchTDA(points,"rips",1);
    persistenceData = data.persistence; // H0+H1
}

document.addEventListener("DOMContentLoaded", init);