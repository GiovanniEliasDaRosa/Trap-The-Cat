var CatSteps = document.getElementById("CatSteps");
var WallQuantityElement = document.getElementById("WallQuantity");
var MapSizeElement = document.getElementById("MapSize");

var ScreenDiv = document.getElementById("Screen");
var StartGameDiv = document.getElementById("StartGame");
var YouWinOrLose = document.getElementById("YouWinOrLose");
var GameWasConfig = document.getElementById("GameWasConfig");

var CatStepsShow = document.getElementById("CatStepsShow");
var WallQuantityShow = document.getElementById("WallQuantityShow");
var MapSizeShow = document.getElementById("MapSizeShow");

var MapElement = document.getElementById("map");
var ItemTemplate = document.getElementById("ItemTemplate");
var cat = document.getElementById("cat");
var catPosition = {};
var OldCatPosition = {};
var CanClick = true;
var MapWidth = 0;
var MapHeight = 0;
var GameOver = false;
var Win = false;
var map = [];
var values = [];
var valuesLog = [];
var walls = [];
var posicaoX = 0;
var posicaoY = 0;
var MiddleMapWidth = 0;
var MiddleMapHeight = 0;
var CanClickAgain = "";

function OnStart() {
  YouWinOrLose.style.display = "none";
  cat.classList.remove("Died");
  cat.classList.remove("Won");
  document.getElementById("Win").style.display = "none";
  document.getElementById("Lost").style.display = "none";

  MapElement.innerHTML = "";

  catPosition = {
    x: 0,
    y: 0,
  };

  OldCatPosition = {
    x: 0,
    y: 0,
  };

  CanClick = true;

  MapWidth = Number(MapSizeElement.value);
  MapHeight = Number(MapSizeElement.value);

  GameOver = false;
  Win = false;

  MapElement.style.gridTemplateColumns = `repeat(${MapWidth}, 64px)`;
  MapElement.style.gridTemplateRows = `repeat(${MapHeight}, 64px)`;

  map = [];
  values = [];
  valuesLog = [];
  walls = [];
  posicaoX = 0;
  posicaoY = 0;

  // Place cat in middle of map
  MiddleMapWidth = Math.floor(MapWidth / 2);
  MiddleMapHeight = Math.floor(MapHeight / 2);

  catPosition.x = MiddleMapWidth;
  catPosition.y = MiddleMapHeight;

  cat.style.left = catPosition.x * 64 + "px";
  cat.style.top = catPosition.y * 64 + "px";

  // Cria o mapa
  for (let x = 0; x < MapWidth; x++) {
    let line = [];
    for (let y = 0; y < MapHeight; y++) {
      const template = ItemTemplate.content.cloneNode(true);
      const element = template.querySelector(".item");
      element.classList.add("empty");

      element.setAttribute("data-x", x);
      element.setAttribute("data-y", y);
      element.setAttribute("tabindex", `${y * MapWidth + x}`);

      line.push("empty");

      MapElement.appendChild(element);
    }
    map.push(line);
  }

  // Inicia os valores da array VALUES
  UpdateValues();

  // Coloca paredes aleatórias
  i = 0;

  let WallQuantity = 0;

  switch (WallQuantityElement.value) {
    case "Easy":
      WallQuantity = 8;
      break;
    case "Medium":
      WallQuantity = 16;
      break;
    case "Hard":
      WallQuantity = 32;
      break;
    case "Expert":
      WallQuantity = 0;
      break;
  }

  if (WallQuantityElement.value != "Expert") {
    MaxBlocks = (MapWidth * MapHeight) / WallQuantity;
  } else {
    MaxBlocks = 0;
  }

  // DENSIDADE DE MUROS // WALL density

  while (i < MaxBlocks) {
    var randomX = RandomFrom(0, MapHeight - 1);
    var randomY = RandomFrom(0, MapWidth - 1);

    if (
      (randomX == catPosition.x && randomY == catPosition.y) ||
      (((randomX == catPosition.x - 1 && randomY == catPosition.y) ||
        (randomX == catPosition.x + 1 && randomY == catPosition.y) ||
        (randomY == catPosition.y - 1 && randomX == catPosition.x) ||
        (randomY == catPosition.y + 1 && randomX == catPosition.x)) &&
        values[randomX][randomY].value != 999)
    ) {
      // Diagonal do gato ou parede
    } else {
      map[randomX][randomY] = "clicked";

      values[randomX][randomY].value = 999;
      values[randomX][randomY].changed = false;

      var element = document.querySelectorAll(`[data-y='${randomX}']`)[randomY];

      element.classList.add("clicked");
      element.removeAttribute("onclick");

      i++;
    }
  }

  console.clear();

  // Atualiza a array de valores (de acordo com as novas paredes)
  UpdateValues();

  // Salva os valores de cada quadrante
  quadrantes = {};

  // Olha para cada lado do quadrante e vai modificando na variavel de quadrantes
  OlharQuadrantes();

  // Olhar paredes
  Wall();
}

WallQuantityElement.selectedIndex = 1;
MapSizeElement.selectedIndex = 3;

OnStart();

// When we click in a item
function Clicked(elem) {
  console.clear();
  console.log(
    `%cClicked(${elem.dataset.y}|${elem.dataset.x})`,
    "background-color: rgb(255, 100, 100); color: black; padding-inline: 16px; border-radius: 16px"
  );

  let x = Number(elem.dataset["x"]);
  let y = Number(elem.dataset["y"]);

  if (y == catPosition.x && x == catPosition.y) {
    console.log(
      `%c  > Clicked on cat position\n  > EXITING`,
      "background-color: rgb(51, 43, 0); color: white; padding-inline: 16px; border: solid 2px rgb(102, 85, 0)"
    );
    return;
  } else if (!CanClick) {
    console.log(
      `%c  > Wait for a few miliseconds\n  > EXITING`,
      "background-color: rgb(51, 43, 0); color: white; padding-inline: 16px; border: solid 2px rgb(102, 85, 0)"
    );
    return;
  }

  PlaySound("ClickAudio");

  CanClick = false;

  map[y][x] = "clicked";

  elem.classList.add("clicked");
  elem.removeAttribute("onclick");

  if (!GameOver) {
    // Analisa o mapa inteiro / LEITURA INTELIGENTE
    UpdateValues();

    // Olha as paredes
    Wall();

    // Olha para cada quadrante e vai modificando na variavel de quadrantes
    OlharQuadrantes();

    // Pega a melhor parede do mapa
    // Código que pensa e anda...
    MelhorParede();
  }
}

// Functions
function UpdateValues() {
  console.log(
    `%cUpdateValues()`,
    "background-color: rgb(255, 125, 25); color: black; padding-inline: 16px; border-radius: 16px"
  );
  values = [];

  for (let x = 0; x < MapWidth; x++) {
    let lineValues = [];
    for (let y = 0; y < MapHeight; y++) {
      if (map[x][y] == "clicked") {
        lineValues.push({ value: 999, changed: false });
      } else if (x == catPosition.x && y == catPosition.y) {
        lineValues.push({ value: 0, changed: true });
      } else {
        lineValues.push({ value: 0, changed: false });
      }
    }

    values.push(lineValues);
  }

  // TESTA ESQUERDA E DIREITA
  var LIST = [];

  for (let RunALL = 0; RunALL < (MapWidth * MapHeight) / 2; RunALL++) {
    // console.log(`%cRunALL ${RunALL}`, "background-color: lightblue; color: black; padding-inline: 16px; border-radius: 16px");
    LIST = [];

    for (let x = 0; x < MapWidth; x++) {
      for (let y = 0; y < MapHeight; y++) {
        if (values[x][y].changed == true) {
          LIST.push([x, y]);
        }
      }
    }

    for (let i = 0; i < LIST.length; i++) {
      // console.log(`%cEstamos no Loop ${i}`, "background-color: lightgreen; color: black; padding-inline: 16px; border-radius: 16px");

      for (let TestY = -1; TestY <= 1; TestY++) {
        for (let TestX = -1; TestX <= 1; TestX++) {
          if (
            (TestY == -1 && TestX == -1) ||
            (TestY == -1 && TestX == 1) ||
            (TestY == 1 && TestX == -1) ||
            (TestY == 1 && TestX == 1) ||
            (TestX == 0 && TestY == 0)
          ) {
            // console.warn("BUGADO");
            // IGNORA DIAGONAIS E ELE MESMO
          } else {
            if (
              LIST[i][0] + TestX >= 0 &&
              LIST[i][0] + TestX <= MapWidth - 1 &&
              LIST[i][1] + TestY >= 0 &&
              LIST[i][1] + TestY <= MapHeight - 1
            ) {
              var testNow = values[LIST[i][0] + TestX][LIST[i][1] + TestY];
              var valueTest = values[LIST[i][0]][LIST[i][1]].value + 1;

              if (valueTest != testNow.value && testNow.value != 999 && testNow.changed != true) {
                testNow.value = valueTest;
                testNow.changed = true;
              }
            }
          }
        }
      }
    }
  }

  // -----

  console.log(
    `%c  > Values`,
    "background-color: rgb(200, 125, 25); color: white; padding-inline: 16px; border-radius: 16px"
  );
  console.log(values);

  console.log(
    `%c -- UpdateValues()`,
    "background-color: rgb(255, 125, 25); color: black; padding-inline: 16px; border-radius: 16px"
  );
}

// Função que olha todos os quadrantes
function OlharQuadrantes() {
  quadrantes = {
    cima: 0,
    direita: 0,
    baixo: 0,
    esquerda: 0,
  };

  // CIMA | ---
  for (let up = 0; up <= catPosition.y; up++) {
    for (let testX = 0; testX <= MapWidth - 1; testX++) {
      if (values[testX][up].value == 999) {
        quadrantes.cima++;
      }
    }
  }

  // DIREITA | ---
  for (let up = catPosition.y; up <= MapWidth - 1; up++) {
    for (let testY = 0; testY <= MapWidth - 1; testY++) {
      if (values[up][testY].value == 999) {
        quadrantes.direita++;
      }
    }
  }

  // BAIXO | ---
  for (let up = catPosition.y; up <= MapHeight - 1; up++) {
    for (let testX = 0; testX <= MapWidth - 1; testX++) {
      if (values[testX][up].value == 999) {
        quadrantes.baixo++;
      }
    }
  }

  // ESQUERDA | ---
  for (let up = 0; up <= catPosition.y; up++) {
    for (let testY = 0; testY <= MapWidth - 1; testY++) {
      if (values[up][testY].value == 999) {
        quadrantes.esquerda++;
      }
    }
  }
}

// Função que olha as bordas do mapa
function Wall() {
  console.log(
    `%cWall()`,
    "background-color: rgb(89, 54, 123); color: white; padding-inline: 16px; border-radius: 16px"
  );
  walls = [];

  // Cima
  for (let TestX = 0; TestX < MapWidth; TestX++) {
    var Obj = {
      x: TestX,
      y: 0,
      value: values[TestX][0],
    };

    if (values[TestX][0].value == 0 && values[TestX][0].changed == false) {
    } else {
      walls.push(Obj);
    }
  }

  // Direita
  for (let TestY = 0; TestY < MapHeight; TestY++) {
    var Obj = {
      x: TestY,
      y: MapWidth - 1,
      value: values[TestY][MapWidth - 1],
    };
    if (!walls.includes(Obj)) {
      if (values[TestY][MapWidth - 1].value == 0 && values[TestY][MapWidth - 1].changed == false) {
      } else {
        walls.push(Obj);
      }
    }
  }

  // Baixo
  for (let TestX = 0; TestX < MapWidth; TestX++) {
    var Obj = {
      x: MapHeight - 1,
      y: TestX,
      value: values[MapHeight - 1][TestX],
    };

    if (!walls.includes(Obj)) {
      if (
        values[MapHeight - 1][TestX].value == 0 &&
        values[MapHeight - 1][TestX].changed == false
      ) {
      } else {
        walls.push(Obj);
      }
    }
  }

  // Esquerda
  for (let TestY = 0; TestY < MapHeight; TestY++) {
    var Obj = {
      x: 0,
      y: TestY,
      value: values[0][TestY],
    };

    if (!walls.includes(Obj)) {
      if (values[0][TestY].value == 0 && values[0][TestY].changed == false) {
      } else {
        walls.push(Obj);
      }
    }
  }

  // console.table(walls);

  walls.sort((a, b) => {
    return a.value.value - b.value.value;
  });

  // Pass the removeValue function into the filter function to return the specified value
  console.log(
    `%c > walls`,
    "background-color: rgb(66, 31, 99); color: white; padding-inline: 16px; border-radius: 16px"
  );
  // console.log(walls);
  // console.log(walls[0].value.value);

  if (walls.length == 0 || walls[0].value.value == 999) {
    // Cat was trapped
    setTimeout(() => {
      Win = true;
      FinishGame();
    }, 300);
  } else {
    if (walls[0].value.value == 0) {
      // Cat escaped the map
      setTimeout(() => {
        Win = false;
        FinishGame();
      }, 300);
    }
  }
}

// Função que testa para mover em uma direção aleatória
function RandomMoveTest() {
  let RandomValue = 0;
  let nextX = 0;
  let nextY = 0;
  let CanMoveThere = false;
  let tests = 0;

  ThisPositionValue = values[posicaoX][posicaoY].value;

  if (ThisPositionValue == 999) {
    console.log(
      `%c  > Jogo finalizado, parabéns por ganhar `,
      "background-color: rgb(50, 40, 0); color: white; padding-inline: 16px; border: solid 2px rgb(102, 85, 0)"
    );
    GameOver = true;
    return;
  }

  while (!CanMoveThere) {
    RandomValue = RandomFrom(1, 4);

    if (RandomValue == 1) {
      if (posicaoX + 1 < MapHeight) {
        let ValuesArrayAt = values[posicaoX + 1][posicaoY].value;
        // Direita
        if (ValuesArrayAt != 999 && ValuesArrayAt < ThisPositionValue) {
          nextX = 1;
          CanMoveThere = true;
        }
      }
    } else if (RandomValue == 2) {
      if (posicaoY + 1 < MapWidth) {
        let ValuesArrayAt = values[posicaoX][posicaoY + 1].value;
        // Baixo
        if (ValuesArrayAt != 999 && ValuesArrayAt < ThisPositionValue) {
          nextY = 1;
          CanMoveThere = true;
        }
      }
    } else if (RandomValue == 3) {
      if (posicaoX - 1 > 0) {
        let ValuesArrayAt = values[posicaoX - 1][posicaoY].value;
        // Esquerda
        if (ValuesArrayAt != 999 && ValuesArrayAt < ThisPositionValue) {
          nextX = -1;
          CanMoveThere = true;
        }
      }
    } else if (RandomValue == 4) {
      if (posicaoY - 1 > 0) {
        let ValuesArrayAt = values[posicaoX][posicaoY - 1].value;
        // Cima
        if (ValuesArrayAt != 999 && ValuesArrayAt < ThisPositionValue) {
          nextY = -1;
          CanMoveThere = true;
        }
      }
    }

    // if(threshold > ((MapWidth * MapHeight) / 4)){
    //   console.log(`%c  > threshold > ${(((MapWidth * MapHeight) / 4))}\n  > EXITING `, "background-color: rgb(51, 43, 0); color: white; padding-inline: 16px; border: solid 2px rgb(102, 85, 0)");
    //     infinity = true;
    //     movimento = [];
    //     break;
    //     // best = true;
    //   }
    // console.log("running");

    tests++;
  }

  posicaoX += nextX;
  posicaoY += nextY;
}

// Função que move o gato em uma direção
function MoveCatInDirection(PosX, PosY) {
  OldCatPosition = {
    ...catPosition,
  };

  catPosition.x = PosX;
  catPosition.y = PosY;

  cat.style.left = catPosition.x * 64 + "px";
  cat.style.top = catPosition.y * 64 + "px";

  cat.classList.add("Walking");
  console.log(OldCatPosition);
  console.log(catPosition);

  if (OldCatPosition.x < catPosition.x) {
    // Going right
    cat.style.scale = "1 1";
  } else if (OldCatPosition.x > catPosition.x) {
    // Going left
    cat.style.scale = "-1 1";
  } else {
    // Same place
    cat.style.scale = "-1 1";
  }

  clearTimeout(CanClickAgain);

  CanClickAgain = setTimeout(() => {
    cat.classList.remove("Walking");
    CanClick = true;
  }, 500);

  // if(passosRestantes == 1){
  //   CatSteps

  //   // Analisa o mapa inteiro / LEITURA INTELIGENTE
  //   UpdateValues();

  //   // Olha as paredes
  //   Wall();

  //   // Olha para cada quadrante e vai modificando na variavel de quadrantes
  //   OlharQuadrantes();

  //   // Pega a melhor parede do mapa
  //   // Código que pensa e anda...
  //   MelhorParede();
  // }
}

// Melhor
function MelhorParede() {
  let melhorparede = 999;
  let MelhoresParedes = [];

  // console.log(`%c  > walls[0]`, "background-color: rgb(200, 80, 80); color: black; padding-inline: 16px; border-radius: 16px");
  // console.log(walls[0]);

  for (let i = 0; i < walls.length; i++) {
    const CurrentWall = walls[i];
    if (CurrentWall.value.value <= melhorparede) {
      melhorparede = CurrentWall.value.value;
      MelhoresParedes.push(CurrentWall);
    }
  }

  // console.log(`%c  > melhorparede ${melhorparede}`, "background-color: rgba(100, 80, 80, 0.5); color: white; padding-inline: 16px; border-radius: 16px");
  // console.log(melhorparede);
  // console.log(MelhoresParedes);

  // Cordenadas das melhores paredes
  // Ele pega essa cordenada e está dentro do quadrante granha
  // +4
  // +3
  // +2
  // +1
  // console.log(`%c  > -----------------`, "background-color: rgba(100, 80, 80, 0.5); color: white; padding-inline: 16px; border-radius: 16px");

  // O código abaixo analisa cada posição em relação ao seu quadrante
  var NotaDaCord = [];

  for (let MelhorTest = 0; MelhorTest < MelhoresParedes.length; MelhorTest++) {
    const EssaCordenada = MelhoresParedes[MelhorTest];
    // console.log(EssaCordenada);

    if (EssaCordenada.x < catPosition.x) {
      // Está na esquerda do gato
      if (EssaCordenada.y < catPosition.y) {
        // Está na cima do gato
        // Quadrante de cima
        // nota da cordenada = largura * altura - (muros do lugar)
        NotaDaCord.push([EssaCordenada.y, EssaCordenada.x, MapWidth * MapHeight - quadrantes.cima]);
      } else {
        // Está na baixo do gato
        // Quadrante de baixo^
        // NotaDaCord.push(EssaCordenada.value.value + quadrantes.baixo);
        NotaDaCord.push([
          EssaCordenada.y,
          EssaCordenada.x,
          MapWidth * MapHeight - quadrantes.baixo,
        ]);
      }
    } else {
      // Está na direita do gato
      if (EssaCordenada.y < catPosition.y) {
        // Está na cima do gato
        // Quadrante de cima
        NotaDaCord.push([EssaCordenada.y, EssaCordenada.x, MapWidth * MapHeight - quadrantes.cima]);
      } else {
        // Está na baixo do gato
        // Quadrante de baixo
        NotaDaCord.push([
          EssaCordenada.y,
          EssaCordenada.x,
          MapWidth * MapHeight - quadrantes.baixo,
        ]);
      }
    }

    if (EssaCordenada.y < catPosition.y) {
      // Está na cima do gato
      if (EssaCordenada.x < catPosition.x) {
        // Está na esquerda do gato
        // Quadrante da esquerda
        NotaDaCord.push([
          EssaCordenada.y,
          EssaCordenada.x,
          MapWidth * MapHeight - quadrantes.esquerda,
        ]);
      } else {
        // Está na direita do gato
        // Quadrante da direita
        NotaDaCord.push([
          EssaCordenada.y,
          EssaCordenada.x,
          MapWidth * MapHeight - quadrantes.direita,
        ]);
      }
    } else {
      // Está na baixo do gato
      if (EssaCordenada.x < catPosition.x) {
        // Está na esquerda do gato
        // Quadrante da esquerda
        NotaDaCord.push([
          EssaCordenada.y,
          EssaCordenada.x,
          MapWidth * MapHeight - quadrantes.esquerda,
        ]);
      } else {
        // Está na direita do gato
        // Quadrante da direita
        NotaDaCord.push([
          EssaCordenada.y,
          EssaCordenada.x,
          MapWidth * MapHeight - quadrantes.direita,
        ]);
      }
    }
  }
  // console.log(`%c  > NotaDaCord`, "background-color: rgb(200, 80, 80); color: black; padding-inline: 16px; border-radius: 16px");
  // console.log(NotaDaCord);
  // console.log(`%c  > ^^----^^`, "background-color: rgb(200, 80, 80); color: black; padding-inline: 16px; border-radius: 16px");

  let sortable = [];
  for (var cord in NotaDaCord) {
    sortable.push(NotaDaCord[cord]);
  }

  sortable.sort(function (a, b) {
    return b[2] - a[2];
  });

  var NotaDaCordOrdem = sortable;
  // console.log(`%c  > NotaDaCordOrdem`, "background-color: rgb(200, 80, 80); color: black; padding-inline: 16px; border-radius: 16px");
  // console.log(NotaDaCordOrdem);

  var MelhorCordenada = 0;
  var MelhoresCordenadas = [];

  // Acha as melhores cordenadas
  for (let i = 0; i < NotaDaCordOrdem.length; i++) {
    const CurrentCord = NotaDaCordOrdem[i];

    if (CurrentCord[2] >= MelhorCordenada) {
      MelhorCordenada = CurrentCord[2];
      MelhoresCordenadas.push(CurrentCord);
    }
  }

  // console.log(`%c  > MelhoresCordenadas`, "background-color: rgb(200, 80, 80); color: black; padding-inline: 16px; border-radius: 16px");
  // console.log(MelhoresCordenadas);

  var RandomCord = RandomFrom(0, MelhoresCordenadas.length - 1);
  var CordenadaEscolhida = MelhoresCordenadas[RandomCord];

  console.log(
    `%c  > CordenadaEscolhida`,
    "background-color: rgb(200, 80, 80); color: black; padding-inline: 16px; border-radius: 16px"
  );
  console.log(CordenadaEscolhida);

  CodigoParaAndar(CordenadaEscolhida);
}

function CodigoParaAndar(CordenadaEscolhida) {
  // Codigo para andar
  var movimento = [];
  var best = false;
  var infinity = false;
  var threshold = 0;

  posicaoX = CordenadaEscolhida[1];
  posicaoY = CordenadaEscolhida[0];

  var valordaposicao = values[posicaoX][posicaoY].value;

  while (!best) {
    if (GameOver) {
      break;
    }
    posicaoX = CordenadaEscolhida[1];
    posicaoY = CordenadaEscolhida[0];

    movimento = [[posicaoX, posicaoY]];

    for (var i = 1; i <= valordaposicao; i++) {
      // Código de movimento anterior que pega um numero aleatório de 1 a 4
      RandomMoveTest();
      if (GameOver) {
        infinity = true;
        break;
      }
      movimento.push([posicaoX, posicaoY]);
    }

    var ult = movimento[movimento.length - 1];

    if (ult[0] == catPosition.x && ult[1] == catPosition.y) {
      console.log(
        `%c| CAT |`,
        "background-color: rgb(0, 200, 40); color: black; padding-inline: 16px; border-radius: 16px"
      );

      movimento = movimento.slice(0, -1);
      best = true;
    }

    threshold++;
    // if(threshold > (MapWidth * MapHeight) * 200){
    if (threshold > (MapWidth * MapHeight) / 4) {
      console.log(
        `%c  > threshold > ${(MapWidth * MapHeight) / 4}\n  > EXITING `,
        "background-color: rgb(51, 43, 0); color: white; padding-inline: 16px; border: solid 2px rgb(102, 85, 0)"
      );
      infinity = true;
      movimento = [];
      break;
      // best = true;
    }
    console.log("running");
  }

  console.log(
    `%c  > ------`,
    "background-color: rgb(200, 80, 80); color: black; padding-inline: 16px; border-radius: 16px"
  );
  console.log(movimento);

  // walls
  // console.log(`%c  > quadrantes[0]`, "background-color: rgb(200, 80, 80); color: black; padding-inline: 16px; border-radius: 16px");
  // console.log(quadrantes);

  // if we passed the max steps for the cat to move
  if (!infinity) {
    console.log(movimento);
    // for (let lin = 0; lin < MapWidth; lin++) {
    //   var line = document.querySelectorAll(`[data-y='${lin}']`);
    //   console.log(line);
    //   console.log([...line]);

    //   line.forEach((elem) => {
    //     elem.classList.remove("SelectedFortesting");
    //   });
    // }
    // for (let i = 0; i < movimento.length; i++) {
    //   const move = movimento[i];
    //   var element = document.querySelector(`[data-y='${move[0]}'][data-x='${move[1]}']`);
    //   console.log(move);
    //   console.log(element);
    //   element.classList.add("SelectedFortesting");
    // }

    // Movimento do gato
    var OndeIr = movimento[movimento.length - 1];
    // console.log(movimento.length);
    // console.log(movimento);

    // if(movimento.length == 1){
    //   setTimeout(() => {
    //     Win = false;
    //     FinishGame();
    //   }, 300);
    // }
    console.log(OndeIr);

    MoveCatInDirection(OndeIr[0], OndeIr[1]);

    if (Number(CatSteps.value) == 2) {
      setTimeout(() => {
        OndeIr = movimento[movimento.length - 2];
        MoveCatInDirection(OndeIr[0], OndeIr[1]);

        // Analisa o mapa inteiro / LEITURA INTELIGENTE
        UpdateValues();

        // Olha as paredes para ver se o gato escapou
        Wall();
      }, 300);
    }

    // Analisa o mapa inteiro / LEITURA INTELIGENTE
    UpdateValues();

    // Olha as paredes para ver se o gato escapou
    Wall();
  }
}

function FinishGame() {
  GameOver = true;
  ScreenDiv.classList.remove("Hide");
  ScreenDiv.classList.add("Show");

  YouWinOrLose.style.display = "block";
  if (Win) {
    // alert('You Won');
    cat.classList.add("Died");
    document.getElementById("Win").style.display = "block";
  } else {
    // alert('You Lost');
    document.getElementById("Lost").style.display = "block";
    cat.classList.add("Won");
  }

  CatStepsShow.innerHTML = CatSteps.selectedOptions[0].innerHTML;
  WallQuantityShow.innerHTML = WallQuantityElement.selectedOptions[0].innerHTML;
  MapSizeShow.innerHTML = MapSizeElement.selectedOptions[0].innerHTML;
}

function StartGame() {
  ScreenDiv.classList = "Hide";
  setTimeout(() => {
    StartGameDiv.style.display = "none";
  }, 1000);

  OnStart();
}

function OpenStartGame() {
  StartGameDiv.style.display = "grid";
  ScreenDiv.classList.remove("Hide");
  ScreenDiv.classList.add("Show");
  YouWinOrLose.style.display = "none";
}
