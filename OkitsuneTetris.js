(function(){
	var BLOCK_SIZE = 20;
	var WINDOW_WIDTH = 640, WINDOW_HEIGHT = 480;
	var FIELD_POS_X = 50, FIELD_POS_Y = 50;
	var ITEM_ICON_POS_X = 260, ITEM_ICON_POS_Y = 40;
	var NEXT_POS_X = 260, NEXT_POS_Y = 80;
	var HOLD_POS_X = 260, HOLD_POS_Y = 120;
	var OKITSUNE_POS_X = 260, OKITSUNE_POS_Y = 180;
	var CURSE_ICON_POS_X = 260, CURSE_ICON_POS_Y = 200;

	var gametime;		// タイマー
	var time;			// テトリミノの落下間隔

	var ctrl;

	var animPlay;				// アニメ再生フラグ
	var okitsuneAnimTime = [];	// アニメ再生時間
	var okitsuneAnimFrame = [];	// アニメ再生総フレーム数
	var okitsuneAnimType = [];	// アニメの種類
	var okitsuneAnimID = 0;		// 配列の引数
	var okitsuneAnimPosX = [];	// アニメを再生する座標
	var okitsuneAnimPosY = [];	// アニメを再生する座標

	var state;			// ゲームの進行状態
	var STATE = {
		INTRO : 0, GAME : 1, GAMEOVER : 2
	}

	var field = [];		// テトリミノを置くフィールド
	var type;			// 操作するテトリミノのタイプ
	var level;			// 落下スピード
	var centerX, centerY;			// 今動かしているテトリミノの中心の座標
	var roundX = [], roundY = [];	// テトリミノの中心以外のブロックの座標
	var next = [];		// 次に出てくるテトリミノ
	var hold = [];

	var numOkitsune;	// 出現したおきつねの数
	var clearOkitsune;	// 消したおきつねの数
	var killedOkitsune;	// 潰したおきつねの数
	var curse = [];		// おきつねの呪いターン数

	var line;			// 消したライン数
	var score;			// スコア
	var highscore;		// ハイスコア

	var item = [];		// アイテムゲットフラグ
	var shadow;			// テトリミノの影の座標

	var okitsunise;		// おきつね化

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
							makeTetromino(-1);
							break;
					}
					break;

				case STATE["GAME"] : 
					switch(key){
					case 32 : // Space 左回転
						// 【のろい】背水 でない
						if(curse[7] == 0){
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
						// 【のろい】奈落
						if(curse[6] > 0)
							hardDropTetromino();
						else
							dropTetromino();
						break;
					case 65 : // ホールドA
						if(canHold && item[2] > 0)
							exchange(0);
						break;
					case 83 : // ホールドS
						if(canHold && item[2] > 1)
							exchange(1);
						break;
					case 68 : // ホールドD
						if(canHold && item[2] > 2)
							exchange(2);
						break;
					case 84 : // タイトルへ
						reStart();
						break;
					case 70 : // かくしこまんど
						type = 'F';
						okitsunise = true;
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
		state = STATE["INTRO"];
		reStart();
	}

	// ゲームオーバー後にリトライ
	function reStart(){
		time = 0;
		animPlay = false;
		okitsuneAnimTime = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		okitsuneAnimType = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		okitsuneAnimID = 0;
		okitsuneAnimPosX = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		okitsuneAnimPosY = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		numOkitsune = 0;
		clearOkitsune = 0;
		killedOkitsune = 0;
		score = 0;
		line = 0;
		level = 1;
		item = [0,0,0,0,0,0,0,0,0,0];
		curse = [0,0,0,0,0,0,0,0,0,0,0];
		hold = ['_', '_', '_'];
		canHold = true;
		okitsunise = false;

		// 潰されアニメリセット
		pressedAnimTime = [0];

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
			next[i] = randomType();
		}
	}

	function randomType(){
		while(true){
			var i = Math.floor(Math.random()*8);
			switch(i){
				case 0 : return'O';
				case 1 : return'T';
				case 2 : return'S';
				case 3 : return'Z';
				case 4 : return'L';
				case 5 : return'J';
				case 6 : return'I';
				case 7 : 
					// 【のろい】猟犬
					if(curse[0] > 0)
						continue;
					else 
						return'F';
			}
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
		var speed = level;

		// 【のろい】猟犬
		if(item[0] > 0)
			speed += 10

		// 【アイテム】スピードダウン
		if(item[4] > 0){
			speed -= 3
			if(speed < 1)
				speed = 1;
		}

		// テトリミノが落ちるタイミング制御
		if(time > 180/speed){
			time = 0;
			// 【のろい】奈落
			if(curse[6] > 0)
				hardDropTetromino();
			else
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
			itemID = Math.floor(Math.random()*9);
			switch (itemID){
				// サポートシャドウ
				case 0 : 
					if(!item[0]){
						item[0] = 3 + Math.floor(Math.random()*4);
						return;
					}
				// NEXTボックス
				case 1 : 
					if(item[1]<5){
						item[1]++; 
						return;
					}
				// NEXTボックス
				case 2 : 
					if(item[2]<3){
						item[2]++; 
						return;
					}
				// ボム
				case 3 : 
					if(item[3]==0){
						item[3]++; 
						return;
					}
				// スピードダウン
				case 4 : 
					if(item[4]==0){
						item[4] = 3 + Math.floor(Math.random()*4); 
						return;
					}
				// フィーバー
				case 5 : 
					if(item[5]==0){
						item[5] = 3 + Math.floor(Math.random()*4); 
						return;
					}
				// スコアアップ
				case 6 : 
					if(item[6]==0){
						item[6] = 3 + Math.floor(Math.random()*4); 
						return;
					}
				// おはらい
				case 7 : 
					item[7] = 1;
					curse[0] = 0;
					curse[1] = 0;
					curse[2] = 0;
					curse[3] = 0;
					curse[4] = 0;
					curse[5] = 0;
					curse[6] = 0;
					curse[7] = 0;
					curse[8] = 0;
					curse[9] = 0;
					curse[10] = 0;
					return;
				// いなり
				case 8 : 
					if(item[8]==0){
						item[8] = 3 + Math.floor(Math.random()*4); 
						return;
					}
			}
		}
	}

	// ----------------------------------------------------------------------
	// テトリミノ
	// ----------------------------------------------------------------------
	// テトリミノの生成
	function makeTetromino(id){
		// テトリミノの生成
		centerX = 5;
		centerY = 1;
		if(id == -1)
			type = next[0];
		else
			type = hold[id];

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
							next[i] = randomType();
						}
					}
				}else
					next[i] = randomType();
			}
			else
				next[i] = next[i+1];
		}
		// 【アイテム】フィーバー
		if(item[5] > 0){
			next = ['I', 'I', 'I', 'I', 'I'];

		// 【アイテム】いなり
		} 
		if(item[8] > 0){
			next = ['F', 'F', 'F', 'F', 'F'];
		}

		// 【アイテム】サポートシャドウ位置計算
		if(item[0] > 0)
			shadow = posShadow();
	}

	// HOLDボックスと交換
	function exchange(id){
		canHold = false;
		var temp = type;
		if(hold[id] == '_'){
			makeTetromino(-1);
		} else {
			makeTetromino(id);
		}
		hold[id] = temp;
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
			// 【アイテム】スコアアップ
			if(item[6] > 0)
				scoreAdd += 3;
			else
				scoreAdd += 1;
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

		for(var i = 0 ; i < 4 ; i++){
			// おきつねの１マス上のテトリミノが落下
			if(field[POS_X[i]][POS_Y[i] + 1] == 'F'){
				killedOkitsune++;

				// おきつねをつぶし更地に
				field[POS_X[i]][POS_Y[i] + 1] = '_';

				// つぶされアニメ有効化
				okitsuneAnimID = (okitsuneAnimID+1)%20;
				okitsuneAnimType[okitsuneAnimID] = 0;
				okitsuneAnimFrame[okitsuneAnimID] = 15;
				okitsuneAnimTime[okitsuneAnimID] = 15;
				okitsuneAnimPosX[okitsuneAnimID] = FIELD_POS_X + POS_X[i]*BLOCK_SIZE;
				okitsuneAnimPosY[okitsuneAnimID] = FIELD_POS_Y + (POS_Y[i] + 1)*BLOCK_SIZE;

				// のろい設定
				if(item[7] == 0){
					var curseType = Math.floor(Math.random()*9);
					var curseTurn = Math.floor(Math.random()*(5 + 1));
					curse[curseType] = curseTurn;
					switch(curseType){
						// 猟犬
						case 1 : 
							for(var i = 0 ; i<5 ; i++){
								if(next[i] = 'F')
									next[i] = randomType();
							}
							break;

						// 呪縛
						case 5 : 
							for(var i = 0 ; i<5 ; i++){
								next[i] = Math.floor(Math.random()*2)==0 ? 'S':'Z';
							}
							//フィーバー無効
							item[5] = 0;
							break;

						default : 
							break;
					}
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
			makeTetromino(-1);

			// ターン経過
			if(item[0] > 0)
				item[0]--;
			if(item[3] > 0)
				item[3]--;
			if(item[4] > 0)
				item[4]--;
			if(item[5] > 0)
				item[5]--;
			if(item[6] > 0)
				item[6]--;
			if(item[7] > 0)
				item[7]--;
			if(item[8] > 0)
				item[8]--;

			if(curse[0] > 0)
				curse[0]--;
			if(curse[1] > 0)
				curse[1]--;
			if(curse[2] > 0)
				curse[2]--;
			if(curse[3] > 0){
				// 【のろい】荒天
				for(var i = 0 ; i < 5 ; i++){
					var X = Math.floor(Math.random()*10);
					var Y = Math.floor(Math.random()*20);
					if(field[X][Y] != 'F')
						field[X][Y] = '_';
				}
				curse[3]--;
			}
			if(curse[4] > 0)
				curse[5]--;
			if(curse[5] > 0)
				curse[5]--;
			if(curse[6] > 0)
				curse[6]--;
			if(curse[7] > 0)
				curse[7]--;
			if(curse[8] > 0)
				curse[8]--;
			if(curse[9] > 0)
				curse[9]--;

			// ホールド許可
			canHold = true;
			okitsunise = false;

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
		var numElaseLine = 0;
		for (var j = 19; j > 0 ; j--) {
			if(checkLine(j)){
				for (var i = 0; i < 10 ; i++){
					// 消したおきつねをカウント
					if(field[i][j] == 'F'){
						clearOkitsune++;
						getItem();

						// いなくなるアニメ
						okitsuneAnimID = (okitsuneAnimID+1)%20;
						okitsuneAnimType[okitsuneAnimID] = 1;
						okitsuneAnimFrame[okitsuneAnimID] = 50;
						okitsuneAnimTime[okitsuneAnimID] = 50;
						okitsuneAnimPosX[okitsuneAnimID] = FIELD_POS_X + i*BLOCK_SIZE;
						okitsuneAnimPosY[okitsuneAnimID] = FIELD_POS_Y + (j - numElaseLine)*BLOCK_SIZE;
					}
				}
				// ラインをずらす
				for (var k = j; k > 0 ; k--) {
					for (var i = 0; i < 10 ; i++){
						// ラインを消す
						if(k > 0)
							field[i][k] = field[i][k - 1];
						else
							field[i][k] = '_';
					}
				}
			numElaseLine++;
			// レベルUP
			if(line%5 == 0)
				level++;
			// 消した後にずれた部分もチェックしなきゃね
			j++;
			}
		}
		line += numElaseLine;
		// 【アイテム】スコアアップ
		if(item[6] > 0){
			switch(numElaseLine){
				case 1 : 
					score += 300;
				case 2 : 
					score += 750;
				case 3 : 
					score += 1500;
				case 4 : 
					score += 3000;
			}
		} else {
			switch(numElaseLine){
				case 1 : 
					score += 100;
				case 2 : 
					score += 250;
				case 3 : 
					score += 500;
				case 4 : 
					score += 1000;
			}
		}
		// 【のろい】背水 の解除
		if(curse[7] > 0)
			curse[7] = 0;
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
		if(curse[2] > 0)
			ctx.strokeStyle = 'ghostwhite';
		else
			ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);

		// 枠
		ctx.strokeStyle = 'white';
		ctx.strokeRect(FIELD_POS_X-1, FIELD_POS_Y-1, 10*BLOCK_SIZE + 2, 20*BLOCK_SIZE + 2);

		if(curse[2] > 0)
			ctx.strokeStyle = 'ghostwhite';
		else
			ctx.fillStyle = 'gray';
		ctx.fillRect(FIELD_POS_X, FIELD_POS_Y, 10*BLOCK_SIZE, 20*BLOCK_SIZE);

		// 積まれたブロック
		for(var i=0 ; i<10 ;i++){
			for(var j=0 ; j<20 ; j++){
				if(field[i][j] == 'F'){
					var X0 = FIELD_POS_X + i*BLOCK_SIZE;
					var Y0 = FIELD_POS_Y + j*BLOCK_SIZE;
					drawChip(IMAGE_OKITSUNE, X0, Y0, (Math.floor(gametime/20))%3, 0);
				} else if (field[i][j] != '_'){
					drawBlock(false, field[i][j], i, j);
				}
			}
		}

		// 【のろい】黄昏 でないとき有効
		if(curse[2] == 0)
			drawTetromino();

		// アニメの再生
		for(var i = 0 ; i < 20 ; i++){
			// アニメ再生時間が残っている
			if(okitsuneAnimTime[i] > 0){
				ctrl = false;
				var ANIM_T = okitsuneAnimFrame[i] - okitsuneAnimTime[i];
				var animX = okitsuneAnimPosX[i];
				var animY = okitsuneAnimPosY[i];

				switch(okitsuneAnimType[i]){
					case 0 : // つぶされアニメ
						drawChip(IMAGE_OKITSUNE, animX, animY, Math.floor(ANIM_T/5), 1);
						break;
					case 1 : // いなくなるアニメ
						animX += -2 * ANIM_T;
						animY += 0.1 * ANIM_T * ANIM_T;
						drawChip(IMAGE_OKITSUNE, animX, animY, 0, 2);
						break;
				}
				okitsuneAnimTime[i]--;
			} else {
				ctrl = true;
			}
		}
		
		// 【のろい】暗黒
		if(curse[8] > 0){
			ctx.fillStyle = 'black';
			ctx.globalAlpha = 0.9;
			ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
			ctx.globalAlpha = 1.0;
		}

		// スコア表示
		ctx.fillStyle = 'white';
		ctx.fillText("SCORE " + score, 50, 10);
		ctx.fillText("HIGH SCORE " + highscore, 50, 20);
		ctx.fillText("LINE " + line, 50, 30);
		ctx.fillText("LEVEL " + level, 50, 40);

		// NEXTボックス
		// 【のろい】無常 でないとき有効
		if(item[1] > 0 && curse[4] == 0){
			ctx.fillStyle = 'white';
			ctx.fillText("NEXT", NEXT_POS_X, NEXT_POS_Y + 15);
			ctx.fillStyle = 'gray';
			for(var i = 1 ; i < 5 ; i++){
				ctx.fillRect(NEXT_POS_X + (2*i)*BLOCK_SIZE - 1 , NEXT_POS_Y + BLOCK_SIZE - 1, BLOCK_SIZE + 2, BLOCK_SIZE + 2);
			}
			ctx.fillStyle = 'white';
			for(var i = 0 ; i < item[1] ; i++){
				ctx.fillRect(NEXT_POS_X + (2*i)*BLOCK_SIZE - 1 , NEXT_POS_Y + BLOCK_SIZE - 1, BLOCK_SIZE + 2, BLOCK_SIZE + 2);
				if(next[i] == 'F')
					drawChip(IMAGE_OKITSUNE, NEXT_POS_X + (2*i)*BLOCK_SIZE, NEXT_POS_Y + BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
				else
					drawChip(IMAGE_TETROMINO, NEXT_POS_X + (2*i)*BLOCK_SIZE, NEXT_POS_Y + BLOCK_SIZE, typeToInt(next[i]), 0);		
			}
		}

		// HOLDボックス
		if(item[2] > 0){
			ctx.fillStyle = 'white';
			ctx.fillText("HOLD", HOLD_POS_X, HOLD_POS_Y + 15);
			ctx.fillStyle = 'gray';
			for(var i = 1 ; i < 3 ; i++){
				ctx.fillRect(HOLD_POS_X + (2*i)*BLOCK_SIZE - 1 , HOLD_POS_Y + BLOCK_SIZE - 1, BLOCK_SIZE + 2, BLOCK_SIZE + 2);
			}
			ctx.fillStyle = 'white';
			for(var i = 0 ; i < item[2] ; i++){
				ctx.fillRect(HOLD_POS_X + (2*i)*BLOCK_SIZE - 1 , HOLD_POS_Y + BLOCK_SIZE - 1, BLOCK_SIZE + 2, BLOCK_SIZE + 2);
				if(hold[i] == 'F')
					drawChip(IMAGE_OKITSUNE, HOLD_POS_X + (2*i)*BLOCK_SIZE, HOLD_POS_Y + BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
				else
					drawChip(IMAGE_TETROMINO, HOLD_POS_X + (2*i)*BLOCK_SIZE, HOLD_POS_Y + BLOCK_SIZE, typeToInt(hold[i]), 0);		
			}
		}

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

	// ----------------------------------------------------------------------
	// テトリミノ
	// ----------------------------------------------------------------------
	// テトリミノの描画
	function drawTetromino(){
		if(type == 'F'){
			// シャドーおきつね
			if(item[0]){
				ctx.globalAlpha = 0.3;
				drawChip(IMAGE_OKITSUNE, FIELD_POS_X + centerX*BLOCK_SIZE, FIELD_POS_Y + shadow*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
				if(okitsunise){	
					drawChip(IMAGE_OKITSUNE, FIELD_POS_X + (centerX + roundX[0])*BLOCK_SIZE, FIELD_POS_Y + (shadow + roundY[0])*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
					drawChip(IMAGE_OKITSUNE, FIELD_POS_X + (centerX + roundX[1])*BLOCK_SIZE, FIELD_POS_Y + (shadow + roundY[1])*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
					drawChip(IMAGE_OKITSUNE, FIELD_POS_X + (centerX + roundX[2])*BLOCK_SIZE, FIELD_POS_Y + (shadow + roundY[2])*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
				}
				ctx.globalAlpha = 1.0;
			}
			// おきつね
			drawChip(IMAGE_OKITSUNE, FIELD_POS_X + centerX*BLOCK_SIZE, FIELD_POS_Y + centerY*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
			if(okitsunise){
				drawChip(IMAGE_OKITSUNE, FIELD_POS_X + (centerX + roundX[0])*BLOCK_SIZE, FIELD_POS_Y + (centerY + roundY[0])*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
				drawChip(IMAGE_OKITSUNE, FIELD_POS_X + (centerX + roundX[1])*BLOCK_SIZE, FIELD_POS_Y + (centerY + roundY[1])*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
				drawChip(IMAGE_OKITSUNE, FIELD_POS_X + (centerX + roundX[2])*BLOCK_SIZE, FIELD_POS_Y + (centerY + roundY[2])*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
			}
		} else {
			// シャドーテトリミノ
			if(item[0]){
				ctx.globalAlpha = 0.3;
				drawBlock(true, type, centerX, shadow);
				drawBlock(true, type, centerX + roundX[0], shadow + roundY[0]);
				drawBlock(true, type, centerX + roundX[1], shadow + roundY[1]);
				drawBlock(true, type, centerX + roundX[2], shadow + roundY[2]);
				ctx.globalAlpha = 1.0;
			}
			// テトリミノ
			drawBlock(false, type, centerX, centerY);
			drawBlock(false, type, centerX + roundX[0], centerY + roundY[0]);
			drawBlock(false, type, centerX + roundX[1], centerY + roundY[1]);
			drawBlock(false, type, centerX + roundX[2], centerY + roundY[2]);
		}
	}

	// 画面に表示するブロック
	function drawBlock(s, t, posX, posY){
		ctx.fillStyle = getBlockColor(true, t);
		ctx.fillRect(FIELD_POS_X + posX*BLOCK_SIZE, FIELD_POS_Y + posY*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
		ctx.fillStyle = getBlockColor(s, t);
		ctx.fillRect(FIELD_POS_X + 2 + posX*BLOCK_SIZE, FIELD_POS_Y + 2 + posY*BLOCK_SIZE, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
	}

	// テトリミノの色
	function getBlockColor(s, t){
		if(!s){
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
		}else{
			switch(t){
				case 'O' :
					return 'gold';
				case 'T' :
					return 'indigo';
				case 'S' :
					return 'darkred';
				case 'Z' :
					return 'darkgreen';
				case 'L' :
					return 'darkblue';
				case 'J' :
					return 'darkmagenta';
				case 'I' :
					return 'darkcyan';
				default :
					return 'whitesmoke';
			}
		}
	}

	// キャラチップの描画
	function drawChip(img, posX, posY, imgX, imgY){
		ctx.drawImage(img, imgX*BLOCK_SIZE, imgY*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, posX, posY, BLOCK_SIZE, BLOCK_SIZE);
	}

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