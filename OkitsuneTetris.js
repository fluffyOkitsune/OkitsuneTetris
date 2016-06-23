(function(){
	var BLOCK_SIZE = 20;
	var WINDOW_WIDTH = 640, WINDOW_HEIGHT = 480;
	var FIELD_POS_X = 50, FIELD_POS_Y = 50;
	var SCORE_POS_X = 50, SCORE_POS_Y = 10;
	var HIGHSCORE_POS_X = 50, HIGHSCORE_POS_Y = 30;
	var ITEM_ICON_POS_X = 260, ITEM_ICON_POS_Y = 80;
	var CURSE_ICON_POS_X = 260, CURSE_ICON_POS_Y = 200;
	var NEXT_POS_X = 260, NEXT_POS_Y = 120;
	var OKITSUNE_POS_X = 260, OKITSUNE_POS_Y = 180;

	var gametime;		// タイマー
	var time;			// テトリミノの落下間隔

	var ctrl;

	var animTime = [];	// アニメ再生時間

	var state;			// ゲームの進行状態
	var STATE = {
		INTRO : 0, GAME : 1, GAMEOVER : 2
	}

	var field = [];		// テトリミノを置くフィールド
	var type;			// 操作するテトリミノのタイプ
	var speed;			// 落下スピード
	var centerX, centerY;	// 今動かしているテトリミノの中心の座標
	var roundX = [], roundY = [];		// テトリミノの中心以外のブロックの座標
	var next = [];		// 次に出てくるテトリミノ

	var numOkitsune;	// 出現したおきつねの数
	var clearOkitsune;	// 消したおきつねの数
	var killedOkitsune;	// 潰したおきつねの数
	var curse = [];	// おきつねの呪いターン数

	var pressedOkitsuneX = [];	// 潰されているおきつねの座標
	var pressedOkitsuneY = [];
	var pressedAnimTime;		// つぶされアニメ再生時間

	var line;			// 消したライン数
	var score;			// スコア
	var highscore;		// ハイスコア

	var item = [];		// アイテムゲットフラグ
	var shadow;			// テトリミノの影の座標

	// ドキュメントの設定
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');

	// おきつねキャラチップ画像
	var IMAGE_OKITSUNE = new Image();
	IMAGE_OKITSUNE.src = 'okitsune.gif';

	// NEXT用テトリミノ画像
	var IMAGE_TETROMINO = new Image();
	IMAGE_TETROMINO.src = 'tetromino.gif';

	// アイテムアイコン画像
	var IMAGE_ITEM_ICON = new Image();
	IMAGE_ITEM_ICON.src = 'item.gif';

	// のろいアイコン画像
	var IMAGE_CURSE_ICON = new Image();
	IMAGE_CURSE_ICON.src = 'curse.gif';

	// ----------------------------------------------------------------------
	// イベント
	// ----------------------------------------------------------------------
	document.onkeydown = function (e){
		var key = -1;

		// Mozilla(Firefox, NN) and Opera 
		if (e != null) {
			key = e.which;
			e.preventDefault();
			e.stopPropagation();
		// Internet Explorer 
		} else {
			e.preventDefault();
			key = event.keyCode;
			event.returnValue = false; 
			event.cancelBubble = true; 
		}
		if(ctrl){
			switch(state){
				case STATE["INTRO"] : 
					switch(key){
						case 32 : // Space ゲーム開始
							reStart();
							state = STATE["GAME"];
							makeTetromino();
							break;
					}
					break;

				case STATE["GAME"] : 
					switch(key){
					case 32 : // Space 左回転
						if(canRotate()){
							// 回転の計算
							for(var i=0 ; i<3 ; i++){
								var X = roundX[i];
								var Y = roundY[i];
								roundX[i] = -Y;
								roundY[i] = X;
							}
							shadow = posShadow();
						}
						break;
					case 37 : // ← 左移動
						if(canMoveLeft()){
							centerX--;
							shadow = posShadow();
						}
						break;
					case 38 : // ↑ ハードドロップ
						hardDropTetromino();
						break;
					case 39 : // → 右移動
						if(canMoveRight()){
							centerX++;
							shadow = posShadow();
						}
						break;
					case 40 : // ↓ 高速落下
						dropTetromino();
						break;
					}
					break;

				case STATE["GAMEOVER"] : 
					switch(key){
						case 32 : // Space タイトルへ
							state = STATE["INTRO"];
							break;
					}
					break;
			}
		}
	}

	// 開始
	console.log("OKITSUNE TETRIS");
	init();
	window.requestAnimationFrame(loop);

	// 回転できるか
	function canRotate(){
		for(var i=0 ; i<3 ; i++){
			var X = roundX[i];
			var Y = roundY[i];
			var TO_X = centerX - Y;
			var TO_Y = centerY + X;
			if(!(0<= TO_X && TO_X<10 && 0<=TO_Y && TO_Y<20))
				return false;
		}
		return true;
	}

	// ゲームループ
	function loop(){
		update();
		draw();
		window.requestAnimationFrame(loop);
	}

	// ----------------------------------------------------------------------
	// 初期化
	// ----------------------------------------------------------------------
	function init(){
		gametime = 0;
		highscore = 0;

		for(var i = 0 ; i < 3 ; i++){
			pressedOkitsuneX[i] = -1;
			pressedOkitsuneY[i] = -1;
		}
		pressedAnimTime = 0;

		state = STATE["INTRO"];
		reStart();
	}

	// ゲームオーバー後にリトライ
	function reStart(){
		time = 0;

		numOkitsune = 0;
		clearOkitsune = 0;
		killedOkitsune = 0;
		score = 0;
		speed = 1;

		item = [0,1,0,0,0,0,0,0,0,0];
		curse = [0,0,0,0,0,0,0,0,0,0,0];


		// 潰されアニメリセット
		pressedAnimTime = 0;
		pressedOkitsuneX = [-1,-1,-1,-1];
		pressedOkitsuneY = [-1,-1,-1,-1];

		// フィールドの初期化
		for (var i = 0 ; i < 10; i++){
			// 多次元配列が使えないのでちょろまかす
			field[i] = [];
			for (var j = 0 ; j< 20; j++){
				field[i][j] = '_';	
			}
		}

		// テトリミノの出現順番を決める
		for(var i=0 ; i<5 ; i++){
			next[i] = ramdomType();
		}
	}

	function ramdomType(){
		var i = Math.floor(Math.random()*(7 + 1));
		switch(i){
			case 0 : return'O';
			case 1 : return'T';
			case 2 : return'S';
			case 3 : return'Z';
			case 4 : return'L';
			case 5 : return'J';
			case 6 : return'I';
			case 7 : return'F';
		}
	}
	// ======================================================================
	// 更新
	// ======================================================================
	function update(){
		switch(state){
			case STATE["INTRO"] : 
				intro();
				break;
			case STATE["GAME"] : 
				game();
				break;
			case STATE["GAMEOVER"] : 
				gameover();
				break;
		}
		gametime++;
	}

	// ゲーム開始前の状態
	function intro(){
		ctrl = true;
	}

	// ゲーム中の状態
	function game(){
		// テトリミノが落ちるタイミング制御
		if(time > 180/speed){
			time = 0;
			dropTetromino();
		}else{
			if(ctrl)
				time++;	
		}
	}

	// ゲームオーバーの状態
	function gameover(){
	}

	// アイテムゲット
	function getItem(){
		var itemID;
		while(true){
			itemID = Math.floor(Math.random()*8);
			switch (itemID){
				// サポートシャドウ
				case 0 : 
					if(!item[0]){
						item[0] = true;
						return;
					}else{

					}
				// NEXTボックス
				case 1 : 
					if(item[1]<5)
						item[1]++; 
					return;
				// 
			}
		}
	}

	// ----------------------------------------------------------------------
	// テトリミノ
	// ----------------------------------------------------------------------
	// テトリミノの生成
	function makeTetromino(){
		// テトリミノの生成
		centerX = 5;
		centerY = 1;
		type = next[0];

		// 中心以外のテトリミノの相対座標
		switch(type){
			case 'O' :
				roundX[0] = -1;
				roundY[0] = 0;
				roundX[1] = -1;
				roundY[1] = 1;
				roundX[2] = 0;
				roundY[2] = 1;
				break;
			case 'T' :
				roundX[0] = -1;
				roundY[0] = 0;
				roundX[1] = 0;
				roundY[1] = 1;
				roundX[2] = 1;
				roundY[2] = 0;
				break;
			case 'S' :
				roundX[0] = -1;
				roundY[0] = -1;
				roundX[1] = -1;
				roundY[1] = 0;
				roundX[2] = 0;
				roundY[2] = 1;
				break;
			case 'Z' :
				roundX[0] = -1;
				roundY[0] = -1;
				roundX[1] = 0;
				roundY[1] = -1;
				roundX[2] = 1;
				roundY[2] = 0;
				break;
			case 'L' :
				roundX[0] = 0;
				roundY[0] = -1;
				roundX[1] = 0;
				roundY[1] = 1;
				roundX[2] = 1;
				roundY[2] = 1;
				break;
			case 'J' :
				roundX[0] = 0;
				roundY[0] = -1;
				roundX[1] = 0;
				roundY[1] = 1;
				roundX[2] = -1;
				roundY[2] = 1;
				break;
			case 'I' :
				roundX[0] = 0;
				roundY[0] = -1;
				roundX[1] = 0;
				roundY[1] = 1;
				roundX[2] = 0;
				roundY[2] = 2;
				break;
			case 'F' :
				roundX[0] = 0;
				roundY[0] = 0;
				roundX[1] = 0;
				roundY[1] = 0;
				roundX[2] = 0;
				roundY[2] = 0;
				numOkitsune++;
				break;
		}

		// nextをずらす
		for(var i=0 ; i<5 ; i++){
			if(i == 4){
				// 【のろい】呪縛
				if(curse[5] > 0){
					next[i] = Math.floor(Math.random()*2)==0 ? 'S':'Z';
					curse[5]--;
					if(curse[5]==0){
						// 通常に戻る
						for(var i=1 ; i<5 ; i++){
							next[i] = ramdomType();
						}
					}
				}else{
					next[i] = ramdomType();
				}
			}
			else
				next[i] = next[i+1];
		}

		// 【アイテム】フィーバー
		if(item[5] > 0){
			next = ['I', 'I', 'I', 'I', 'I'];
			item[5]--;	
		}
		
		// 【アイテム】サポートシャドウ位置計算
		if(item[0] > 0)
			shadow = posShadow();
	}

	// テトリミノの落下
	function dropTetromino(){
		var b = fixTetromino();
		if(!b){
			shadow = posShadow();
			pressOkitsune();
			centerY++;
		}
		return b;
	}

	// テトリミノの影の位置計算
	function posShadow(){
		var POS_X = [centerX, centerX + roundX[0], centerX + roundX[1], centerX + roundX[2]];
		var POS_Y = [centerY, centerY + roundY[0], centerY + roundY[1], centerY + roundY[2]];
		
		// ブロックまでの距離
		for (var i = centerY ; i < 20 ; i++){
			if(field[POS_X[0]][i] != 'F' && field[POS_X[0]][i] != '_' || 
				(i + roundY[0]) < 20 && (type == 'F' || field[POS_X[1]][i + roundY[0]] != 'F') && field[POS_X[1]][i + roundY[0]] != '_' ||  
				(i + roundY[1]) < 20 && (type == 'F' || field[POS_X[2]][i + roundY[1]] != 'F') && field[POS_X[2]][i + roundY[1]] != '_' ||  
				(i + roundY[2]) < 20 && (type == 'F' || field[POS_X[3]][i + roundY[2]] != 'F') && field[POS_X[3]][i + roundY[2]] != '_' )
				return i - 1;
		}

		// 一番下までの距離
		var d = POS_Y[0];
		for (var i = 1; i < 4 ; i++){
			if(d < POS_Y[i])
				d = POS_Y[i];
		}
		return 19 - (d - centerY);
	}

	// テトリミノのハードドロップ
	function hardDropTetromino(){
		ctrl = false;
		var scoreAdd = 0;
		while(!dropTetromino()){
			scoreAdd += 10;
		}
		score += scoreAdd;
		ctrl = true;
	}

	// おきつねをつぶす
	function pressOkitsune(){
		var POS_X = [centerX, centerX + roundX[0], centerX + roundX[1], centerX + roundX[2]];
		var POS_Y = [centerY, centerY + roundY[0], centerY + roundY[1], centerY + roundY[2]];

		// つぶされ
		var pressedOkitsuneID = 0;

		// おきつねの１マス上
		for(var i = 0 ; i < 4 ; i++){
			if(field[POS_X[i]][POS_Y[i] + 1] == 'F'){
				killedOkitsune++;

				// おきつねをつぶし更地に
				field[POS_X[i]][POS_Y[i] + 1] = '_';

				// つぶされアニメ有効化
				pressedAnimTime = 15;

				// 座標を記録
				pressedOkitsuneX[pressedOkitsuneID] = POS_X[i];
				pressedOkitsuneY[pressedOkitsuneID] = POS_Y[i] + 1;

				// のろい設定
				var curseType = 5//Math.floor(Math.random()*11);
				var curseTurn = Math.floor(Math.random()*(5 + 1));
				curse[curseType] = curseTurn;
				switch(curseType){
					// 呪縛
					case 5 : 
						for(var i = 0 ; i<5 ; i++){
							next[i] = Math.floor(Math.random()*2)==0 ? 'S':'Z';
						}
						//フィーバー無効
						item[5] = 0;
						break;
				}

			}
		}
	}

	// テトリミノの固着
	function fixTetromino(){
		if(!canFall()){
			// ゲームオーバー判定
			if(centerY <= 2){
				state = STATE["GAMEOVER"];
				return true;
			}

			// フィールドに書き込む
			field[centerX][centerY] = type;
			field[centerX + roundX[0]][centerY + roundY[0]] = type;
			field[centerX + roundX[1]][centerY + roundY[1]] = type;
			field[centerX + roundX[2]][centerY + roundY[2]] = type;

			// ラインを消去
			elaseLine();

			// 新しいテトリミノを生成
			makeTetromino();

			return true;
		}
		return false;
	}

	// テトリミノが下に落ちれるかどうか
	function canFall(){
		var POS_X = [centerX, centerX + roundX[0], centerX + roundX[1], centerX + roundX[2]];
		var POS_Y = [centerY, centerY + roundY[0], centerY + roundY[1], centerY + roundY[2]];

		// 落下先
		var FIELD = [];
		for(var i = 0 ; i < 4 ; i++){
			FIELD[i] = field[POS_X[i]][POS_Y[i] + 1];
		}
		
		// 接地した場合
		for(var i = 0 ; i < 4 ; i++){
			if(POS_Y[i] == 20)
				return false;
		}

		// 他のブロックと接触
		for(var i = 0 ; i < 4 ; i++){
			if(FIELD[i] != '_' && (type == 'F' || FIELD[i] != 'F'))
				return false;
		}
		return true;
	}

	// ラインを消去
	function elaseLine(){
		for (var j = 19; j > 0 ; j--) {
			if(checkLine(j)){
				// ラインをずらす
				for (var k = j; k > 0 ; k--) {
					for (var i = 0; i < 10 ; i++){
						// 消したおきつねをカウント
						if(field[i][k] == 'F'){
							clearOkitsune++;
							getItem();
						}
						// スピードUP
						if(line%5 == 0)
							speed++;
						// ラインを消す
						if(k > 0)
							field[i][k] = field[i][k - 1];
						else
							field[i][k] = '_';
					}
				}
			// 消した後にずれた部分もチェックしなきゃね
			j++;
			}
		}
	}

	// 横一列にそろっているかチェック
	function checkLine(j){
		for (var i = 0 ; i < 10 ; i++) {
			if(field[i][j] == '_')
				return false;
		}
		return true;
	}

	// 左に移動できるか
	function canMoveLeft(){
		if(centerX == 0  || centerX + roundX[0] == 0 || centerX + roundX[1] == 0 || centerX + roundX[2] == 0 )
			return false;
		else if(field[centerX - 1][centerY] != '_'  || field[centerX + roundX[0] - 1][centerY + roundY[0]] != '_'  || 
				field[centerX + roundX[1] - 1][centerY + roundY[1]] != '_'  || field[centerX + roundX[2] - 1][centerY + roundY[2]] != '_' )
			return false;
		return true;
	}

	// 右に移動できるか
	function canMoveRight(){
		if(centerX == 9  || centerX + roundX[0] == 9 || centerX + roundX[1] == 9 || centerX + roundX[2] == 9 )
			return false;
		else if(field[centerX + 1][centerY] != '_'  || field[centerX + roundX[0] + 1][centerY + roundY[0]] != '_'  || 
				field[centerX + roundX[1] + 1][centerY + roundY[1]] != '_'  || field[centerX + roundX[2] + 1][centerY + roundY[2]] != '_' )
			return false;
		return true;
	}

	// ======================================================================
	// 描画
	// ======================================================================
	function draw(){
		// まわりの闇部分
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);

		drawField();
		drawTetromino();

		// つぶされアニメ
		if(pressedAnimTime > 0){
			ctrl = false;
			for(var i=0 ; i<4 ; i++){
				if(pressedOkitsuneX[i] >= 0 && pressedOkitsuneY[i] >= 0 ){
					drawChip(IMAGE_OKITSUNE, FIELD_POS_X + pressedOkitsuneX[i]*BLOCK_SIZE, FIELD_POS_Y + pressedOkitsuneY[i]*BLOCK_SIZE, Math.floor((15 - pressedAnimTime)/5), 1);	
				}
			}
			pressedAnimTime--;
			if(pressedAnimTime == 0)
				ctrl = true;
		}

		// スコア表示
		ctx.fillStyle = 'white';
		ctx.fillText("SCORE " + score, SCORE_POS_X, SCORE_POS_Y);
		ctx.fillText("HIGH SCORE " + highscore, HIGHSCORE_POS_X, HIGHSCORE_POS_Y);

		// NEXTボックス
		ctx.fillStyle = 'white';
		ctx.fillRect(NEXT_POS_X - 1 , NEXT_POS_Y + BLOCK_SIZE - 1, BLOCK_SIZE * 9 + 2, BLOCK_SIZE + 2);
		ctx.fillText("NEXT", NEXT_POS_X, NEXT_POS_Y + 15);

		// 所持アイテムのアイコン
		ctx.fillStyle = 'white';
		ctx.fillRect(ITEM_ICON_POS_X - 1 , ITEM_ICON_POS_Y + BLOCK_SIZE - 1, BLOCK_SIZE * 9 + 2, BLOCK_SIZE + 2);
		ctx.fillText("ITEM", ITEM_ICON_POS_X, ITEM_ICON_POS_Y + 15);
		for(var i = 0 ; i < 9 ; i++){
			if(item[i] > 0){
 				drawChip(IMAGE_ITEM_ICON, ITEM_ICON_POS_X + BLOCK_SIZE * i, ITEM_ICON_POS_Y + BLOCK_SIZE, i, 0);
 			}
		}

		// おきつね数
		drawChip(IMAGE_OKITSUNE, OKITSUNE_POS_X, OKITSUNE_POS_Y, (Math.floor(gametime/20))%3, 0);
		ctx.fillStyle = 'white';
		ctx.fillText("OKITSUNE x" + numOkitsune, OKITSUNE_POS_X + 20, OKITSUNE_POS_Y + 5);
		ctx.fillText("GOT      x" + clearOkitsune, OKITSUNE_POS_X + 20, OKITSUNE_POS_Y + 15);
		ctx.fillText("KILLED   x" + killedOkitsune, OKITSUNE_POS_X + 20, OKITSUNE_POS_Y + 25);

		// のろいのアイコン
		ctx.fillStyle = '#777777';
		ctx.fillRect(CURSE_ICON_POS_X - 1 , CURSE_ICON_POS_Y + BLOCK_SIZE - 1, BLOCK_SIZE * 11 + 2, BLOCK_SIZE + 2);
		ctx.fillStyle = 'white';
		ctx.fillText("KITSUNE NO NOROI", CURSE_ICON_POS_X, CURSE_ICON_POS_Y + 15);
		for(var i = 0 ; i < 11 ; i++){
			if(curse[i] > 0){
 				drawChip(IMAGE_CURSE_ICON, CURSE_ICON_POS_X + BLOCK_SIZE * i, CURSE_ICON_POS_Y + BLOCK_SIZE, i, 0);
 			}
		}

		for(var i = 0 ; i < item[1] ; i++){
			if(next[i] == 'F')
				drawChip(IMAGE_OKITSUNE, NEXT_POS_X + (2*i)*BLOCK_SIZE, NEXT_POS_Y + BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
			else
				drawChip(IMAGE_TETROMINO, NEXT_POS_X + (2*i)*BLOCK_SIZE, NEXT_POS_Y + BLOCK_SIZE, typeToInt(next[i]), 0);		
		}

		// 状態別
		switch(state){
			case STATE["INTRO"] : 
				ctx.fillStyle = 'white';
				ctx.fillText("PRESS SPACE KEY TO START !!", 80, 200);
				break;
			case STATE["GAME"] : 
				break;
			case STATE["GAMEOVER"] : 
				ctx.fillStyle = 'red';
				ctx.fillText("GAME OVER", 110, 200);
				break;
		}
	}

	// フィールドの描画
	function drawField(){
		// 枠
		ctx.strokeStyle = 'white';
		ctx.rect(FIELD_POS_X-1, FIELD_POS_Y-1, 10*BLOCK_SIZE + 2, 20*BLOCK_SIZE + 2);
		ctx.stroke();

		ctx.fillStyle = 'gray';
		ctx.fillRect(FIELD_POS_X, FIELD_POS_Y, 10*BLOCK_SIZE, 20*BLOCK_SIZE);

		// 積まれたブロック
		for(var i=0 ; i<10 ;i++){
			for(var j=0 ; j<20 ; j++){
				// ブロック左上の座標
				var X0 = FIELD_POS_X + i*BLOCK_SIZE;
				var Y0 = FIELD_POS_Y + j*BLOCK_SIZE;

				// 描画
				if(field[i][j] == 'F'){
					drawChip(IMAGE_OKITSUNE, X0, Y0, (Math.floor(gametime/20))%3, 0);
				} else if (field[i][j] != '_'){
					ctx.fillStyle = getBlockColor(field[i][j]);
					ctx.fillRect(X0, Y0, BLOCK_SIZE, BLOCK_SIZE);
				}
			}				
		}
	}

	// ----------------------------------------------------------------------
	// テトリミノ
	// ----------------------------------------------------------------------
	// テトリミノの描画
	function drawTetromino(){
		if(type == 'F'){
			// おきつね
			drawChip(IMAGE_OKITSUNE, FIELD_POS_X + centerX*BLOCK_SIZE, FIELD_POS_Y + centerY*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
			// シャドーおきつね
			if(item[0]){
				ctx.globalAlpha = 0.3;
				drawChip(IMAGE_OKITSUNE, FIELD_POS_X + centerX*BLOCK_SIZE, FIELD_POS_Y + shadow*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
				ctx.globalAlpha = 1.0;
			}
		} else {
			// テトリミノ
			drawBlock(centerX, centerY);
			drawBlock(centerX + roundX[0], centerY + roundY[0]);
			drawBlock(centerX + roundX[1], centerY + roundY[1]);
			drawBlock(centerX + roundX[2], centerY + roundY[2]);
			// シャドーテトリミノ
			if(item[0]){
				ctx.globalAlpha = 0.3;
				drawBlock(centerX, shadow);
				drawBlock(centerX + roundX[0], shadow + roundY[0]);
				drawBlock(centerX + roundX[1], shadow + roundY[1]);
				drawBlock(centerX + roundX[2], shadow + roundY[2]);
				ctx.globalAlpha = 1.0;
			}
		}
	}

	// 画面に表示するブロック
	function drawBlock(posX, posY){
		ctx.fillStyle = getBlockColor(type);
		ctx.fillRect(FIELD_POS_X + posX*BLOCK_SIZE, FIELD_POS_Y + posY*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
	}

	// テトリミノの色
	function getBlockColor(t){
		switch(t){
			case 'O' :
				return 'yellow';
			case 'T' :
				return 'purple';
			case 'S' :
				return 'red';
			case 'Z' :
				return 'green';
			case 'L' :
				return 'blue';
			case 'J' :
				return 'magenta';
			case 'I' :
				return 'cyan';
			default :
				return 'white';
		}
	}

	// キャラチップの描画
	function drawChip(img, posX, posY, imgX, imgY){
 		ctx.drawImage(img, imgX*BLOCK_SIZE, imgY*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, posX, posY, BLOCK_SIZE, BLOCK_SIZE);
	}

	// ----------------------------------------------------------------------
	// アイテム効果
	// ----------------------------------------------------------------------
	// ----------------------------------------------------------------------
	// のろい
	// ----------------------------------------------------------------------

	// ======================================================================
	// その他
	// ======================================================================
	// Type -> Int変換
	function typeToInt(i){
		switch(i){
			case 'O' : return 0;
			case 'T' : return 1;
			case 'S' : return 2;
			case 'Z' : return 3;
			case 'L' : return 4;
			case 'J' : return 5;
			case 'I' : return 6;
		}
	}
})()