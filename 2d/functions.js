    const canvas = document.getElementById("drawCanvas");
    const ctx = canvas.getContext("2d");
    const dimension = document.getElementById("dimension");
    const radiusRange = document.getElementById("radiusRange");
    const radiusValue = document.getElementById("radiusValue");
    const radiusInfo = document.getElementById("radiusInfo");
    const regenBtn = document.getElementById("regenBtn");
    const randomSetBtn = document.getElementById("randomSetBtn");
    const strictTriangle = document.getElementById("strictTriangle");
    const pointCountInput = document.getElementById("pointCount");
    const pointCountValue = document.getElementById("pointCountValue");
    const pointCountInfo = document.getElementById("pointCountInfo");

    let pointCount = Number(pointCountInput.value);
    let strictTriangleMode = false;

    barcodeCanvasScale = parseFloat(radiusRange.value)*4

    let points = [];
    let persistenceData = [];
    const maxPixelDistance = Math.hypot(canvas.width, canvas.height);

    // Random noktalar
    function newPoints(n = 30){
        points = [];
        for(let i=0;i<n;i++){
            points.push({x:50+Math.random()*700, y:50+Math.random()*400});
        }
    }

    async function fetchTDA(points){
        const formattedPoints = points.map(p=>[p.x, p.y]);
        const max_edge_length = Math.hypot(window.innerWidth, window.innerHeight);
        const res = await fetch("http://127.0.0.1:8000/tda", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
                points: formattedPoints,
                complex_type: "rips",
                max_edge_length: max_edge_length,
                max_dimension:2
            })
        });
        data = await res.json();
        persistenceData = data.persistence;
    }

    function drawBarcodeDynamic(epsilon, canvasId, dimension=1){
        const barcodeCanvas = document.getElementById(canvasId);
        const ctx = barcodeCanvas.getContext("2d");
        ctx.clearRect(0,0,barcodeCanvas.width, barcodeCanvas.height);

        const h1 = persistenceData.filter(d => d.dim === parseInt(dimension));
        if(h1.length === 0) return;

        const padding = 20;
        const width = barcodeCanvas.width - 2*padding;

        // maxDeath yerine slider max değerini kullan
        const sliderMax = parseFloat(radiusRange.max); // 500
        h1.forEach((d, i) => {
            const y = padding + i*15;
            const birthX = padding + (d.birth / sliderMax) * width;
            const deathVal = d.death !== null ? d.death : sliderMax;

            if(epsilon > d.birth){
                const visibleEnd = Math.min(epsilon, deathVal);
                ctx.strokeStyle = "#4cc9f0";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(birthX, y);
                ctx.lineTo(padding + (visibleEnd / sliderMax) * width, y);
                ctx.stroke();
            }
        });
    }
    
    function drawPoints() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="rgba(4,13,46,0.16)";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        const eps = parseFloat(radiusRange.value);

        // Rips: çizgiler
        for(let i=0;i<points.length;i++){
            for(let j=i+1;j<points.length;j++){
                const a = points[i], b = points[j];
                const dist = Math.hypot(a.x-b.x, a.y-b.y);
                if(dist <= eps){
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = "rgba(45, 225, 255, 0.87)";
                    ctx.lineWidth = 1.8;
                    ctx.stroke();
                }
            }
        }
        
        // Noktaları daima çiz
        points.forEach(p=>{
            ctx.beginPath();
            ctx.arc(p.x,p.y,4,0,Math.PI*2);
            ctx.fillStyle="#ff66b2";
            ctx.fill();
        });
    }

    async function init(){
        newPoints(30);
        drawPoints();
        
        await fetchTDA(points,"rips");
        persistenceData = data.persistence;

        drawBarcodeDynamic(parseFloat(radiusRange.value),"barcodeCanvas", dimension.value);
    }

    document.addEventListener("DOMContentLoaded", init);

    function circleTripleIntersection(a, b, c, r) {
        // Mesafeler
        const ab = Math.hypot(a.x - b.x, a.y - b.y);
        const ac = Math.hypot(a.x - c.x, a.y - c.y);
        const bc = Math.hypot(b.x - c.x, b.y - c.y);

        // Eğer herhangi bir mesafe > 2*r ise çember mümkün değil
        if (ab > 2*r || ac > 2*r || bc > 2*r) return false;

        // Her üç noktanın circumradius'u
        const s = (ab + ac + bc) / 2;
        const area = Math.sqrt(s * (s - ab) * (s - ac) * (s - bc));
        if (area === 0) return false; // üç nokta aynı doğru üzerinde

        const circumradius = (ab * ac * bc) / (4 * area);

        return circumradius <= r;
    }

    async function draw(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(4, 13, 46, 0.16)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Eğer 3 nokta arasındaki her çizgi varsa, içini doldur
        for (let i = 0; i < points.length; i++) {
            p = points[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, parseFloat(radiusRange.value/2), 0, Math.PI*2);
            ctx.strokeStyle="rgba(57, 202, 255, 0.15)";
            ctx.lineWidth=2;
            ctx.stroke();

            for (let j = i + 1; j < points.length; j++) {
            for (let k = j + 1; k < points.length; k++) {
                const a = points[i];
                const b = points[j];
                const c = points[k];


                const dij = Math.hypot(a.x - b.x, a.y - b.y);
                const dik = Math.hypot(a.x - c.x, a.y - c.y);
                const djk = Math.hypot(b.x - c.x, b.y - c.y);
                if (dij <= parseFloat(radiusRange.value) && dik <= parseFloat(radiusRange.value) && djk <= parseFloat(radiusRange.value)) {
                if (!strictTriangleMode || circleTripleIntersection(a, b, c, parseFloat(radiusRange.value))) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.lineTo(c.x, c.y);
                    ctx.closePath();
                    ctx.fillStyle = "rgba(57, 201, 255, 0.50)";
                    ctx.fill();
                    
                }
                }
            }
            }
        }

        // Çizgileri öne çıkar
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
            const a = points[i];
            const b = points[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= parseFloat(radiusRange.value)) {
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = "rgba(45, 225, 255, 0.87)";
                ctx.lineWidth = 1.8;
                ctx.shadowColor = "rgba(50, 255, 255, 0.5)";
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            }
        }

        // Noktaları daima çizin
        points.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#ff66b2";
            ctx.fill();
        });

        drawBarcodeDynamic(parseFloat(radiusRange.value), "barcodeCanvas", dimension.value);
    }

    radiusRange.addEventListener("input", () => {

        radiusValue.textContent = parseFloat(radiusRange.value/500).toFixed(2);
        radiusInfo.textContent = `Yarıçap: ${parseFloat(radiusRange.value/500).toFixed(2)}`;

        draw(); 
        drawBarcodeDynamic(parseFloat(radiusRange.value), "barcodeCanvas", dimension.value);
    });

    pointCountInput.addEventListener("input", async () => {
      pointCount = Number(pointCountInput.value)
      pointCountValue.textContent = pointCount;
      newPoints(pointCount);
      await fetchTDA(points);
      draw();
    });

    regenBtn.addEventListener("click", async () => {
      pointCount = Number(pointCountInput.value);
      newPoints();
      await fetchTDA(points, 'rips');
      draw();
    });

    dimension.addEventListener("change", () => {
        drawBarcodeDynamic(parseFloat(radiusRange.value), "barcodeCanvas", dimension.value);
    });

    newPoints();
    draw();