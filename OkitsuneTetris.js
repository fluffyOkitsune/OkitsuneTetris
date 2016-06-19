(function(){
	var BLOCK_SIZE = 20;
	var WINDOW_WIDTH = 640, WINDOW_HEIGHT = 480;
	var FIELD_POS_X = 50, FIELD_POS_Y = 50;
	var SCORE_POS_X = 50, SCORE_POS_Y = 10;
	var HIGHSCORE_POS_X = 50, HIGHSCORE_POS_Y = 30;

	var gametime;		// タイマー
	var time;			// テトリミノの落下間隔

	var field = [];		// テトリミノを置くフィールド
	var speed;			// 落下スピード
	var next = [];		// 次に出てくるテトリミノ

	var type;			// 操作するテトリミノのタイプ
						// O,T,S,Z,L,J,I + おきつね
	var centerX, centerY;	// 今動かしているテトリミノの中心位置
	var x = [], y = [];
	var rotate;				// 回転回数

	var item = [];		// アイテムゲットフラグ
	var numOkitsune;	// 出現したおきつねの数
	var clearOkitsune;	// 消したおきつねの数
	var curse;			// おきつねの呪いターン数

	var score;			// スコア
	var highscore;		// ハイスコア

	// ドキュメントの設定
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');

	// おきつねキャラチップ画像
	var IMAGE_OKITSUNE = new Image();
	IMAGE_OKITSUNE.src = 'okitsune.gif';

	// イベント
	document.onkeydown = function (e){
		e.preventDefault();
		key = event.keyCode;
		switch(key){
			case 32 : // Space 左回転
				for(var i=0 ; i<3 ; i++){
					var X = x[i];
					var Y = y[i];
					x[i] = -Y;
					y[i] = X;
				}
				break;
			case 37 : // ← 左移動
				if(canMoveLeft())
					centerX--;
				break;
			case 38 : // ↑ ハードドロップ
				hardDropTetromino();
				break;
			case 39 : // → 右移動
				if(canMoveRight())
					centerX++;
				break;

			case 40 : // ↓ 高速落下
				dropTetromino();
				break;
		}	
	}

	// 開始
	init();
	window.requestAnimationFrame(loop);

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
		// タイマーリセット
		gametime = 0;
		time = 0;

		numOkitsune = 0;
		clearOkitsune = 0;
		curse = 0;
		score = 0;
		highscore = 0;

		speed = 1;

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
		makeTetromino();
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

	// ----------------------------------------------------------------------
	// 更新
	// ----------------------------------------------------------------------
	function update(){
		if(time>180/speed){
			time = 0;
			dropTetromino();

		}else{
			time++;	
		}
		gametime++;
	}

	// テトリミノの生成
	function makeTetromino(){
		type = next[0];

		// nextをずらす
		for(var i=0 ; i<5 ; i++){
			if(i == 4)
				next[i] = ramdomType();
			else
				next[i] = next[i+1];
		}

		centerX = 5;
		centerY = 1;

		console.log(type);

		// 生成するテトリミノの種類
		switch(type){
			case 'O' :
				x[0] = -1;
				y[0] = 0;
				x[1] = -1;
				y[1] = 1;
				x[2] = 0;
				y[2] = 1;
				break;
			case 'T' :
				x[0] = -1;
				y[0] = 0;
				x[1] = 0;
				y[1] = 1;
				x[2] = 1;
				y[2] = 0;
				break;
			case 'S' :
				x[0] = -1;
				y[0] = -1;
				x[1] = -1;
				y[1] = 0;
				x[2] = 0;
				y[2] = 1;
				break;
			case 'Z' :
				x[0] = -1;
				y[0] = -1;
				x[1] = 0;
				y[1] = -1;
				x[2] = 1;
				y[2] = 0;
				break;
			case 'L' :
				x[0] = 0;
				y[0] = -1;
				x[1] = 0;
				y[1] = 1;
				x[2] = 1;
				y[2] = 1;
				break;
			case 'J' :
				x[0] = 0;
				y[0] = -1;
				x[1] = 0;
				y[1] = 1;
				x[2] = -1;
				y[2] = 1;
				break;
			case 'I' :
				x[0] = 0;
				y[0] = -1;
				x[1] = 0;
				y[1] = 1;
				x[2] = 0;
				y[2] = 2;
				break;
			case 'F' :
				x[0] = 0;
				y[0] = 0;
				x[1] = 0;
				y[1] = 0;
				x[2] = 0;
				y[2] = 0;
				break;
		}
	}

	// テトリミノの落下
	function dropTetromino(){
		centerY++;
		if(fixTetromino()){
			makeTetromino();
		}
	}

	// テトリミノの落下
	function hardDropTetromino(){
		while(!fixTetromino()){
		centerY++;
		}
		makeTetromino();
	}

	// テトリミノの固着
	function fixTetromino(){
		// 接地した場合
		if(	
			centerY == 19  || 
			centerY + y[0] == 19 || 
			centerY + y[1] == 19 || 
			centerY + y[2] == 19
			){
			field[centerX][centerY] = type;
			field[centerX + x[0]][centerY + y[0]] = type;
			field[centerX + x[1]][centerY + y[1]] = type;
			field[centerX + x[2]][centerY + y[2]] = type;
		return true;

		// 他のブロックと接触
		}else if(
			field[centerX][centerY + 1] != '_'  || 
			field[centerX + x[0]][centerY + y[0] + 1] != '_'  || 
			field[centerX + x[1]][centerY + y[1] + 1] != '_'  || 
			field[centerX + x[2]][centerY + y[2] + 1] != '_' 
			){
			field[centerX][centerY] = type;
			field[centerX + x[0]][centerY + y[0]] = type;
			field[centerX + x[1]][centerY + y[1]] = type;
			field[centerX + x[2]][centerY + y[2]] = type;
		return true;
		}
	return false;
	}

	// ラインを消去
	function elaseLine(){
		for (var j = 0; j < Things.length; j++) {
			if(checkLine(j)){
				// ラインをずらす
				
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
		if(centerX == 0  || centerX + x[0] == 0 || centerX + x[1] == 0 || centerX + x[2] == 0 )
			return false;
		else if(field[centerX - 1][centerY] != '_'  || field[centerX + x[0] - 1][centerY + y[0]] != '_'  || 
				field[centerX + x[1] - 1][centerY + y[1]] != '_'  || field[centerX + x[2] - 1][centerY + y[2]] != '_' )
			return false;
		return true;
	}
	// 右に移動できるか
	function canMoveRight(){
		if(centerX == 9  || centerX + x[0] == 9 || centerX + x[1] == 9 || centerX + x[2] == 9 )
			return false;
		else if(field[centerX + 1][centerY] != '_'  || field[centerX + x[0] + 1][centerY + y[0]] != '_'  || 
				field[centerX + x[1] + 1][centerY + y[1]] != '_'  || field[centerX + x[2] + 1][centerY + y[2]] != '_' )
			return false;
		return true;
	}

	// ----------------------------------------------------------------------
	// 描画
	// ----------------------------------------------------------------------
	function draw(){
		// まわりの闇部分
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);

		drawField();
		drawTetromino();

		// スコア表示
		ctx.fillStyle = 'white';
		ctx.fillText("SCORE " + score, SCORE_POS_X, SCORE_POS_Y);
		ctx.fillText("HIGH SCORE " + highscore, HIGHSCORE_POS_X, HIGHSCORE_POS_Y);

	}

	// フィールドの描画
	function drawField(){
		// 枠
		ctx.strokeStyle = 'white';
		ctx.rect(FIELD_POS_X-1, FIELD_POS_Y-1, 10*BLOCK_SIZE + 1, 20*BLOCK_SIZE + 1);

		ctx.fillStyle = 'gray';
		ctx.fillRect(FIELD_POS_X, FIELD_POS_Y, 10*BLOCK_SIZE, 20*BLOCK_SIZE);

		ctx.stroke();

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

	// テトリミノの描画
	function drawTetromino(){
		if(type == 'F'){
			// おきつね
			drawChip(IMAGE_OKITSUNE, FIELD_POS_X + centerX*BLOCK_SIZE, FIELD_POS_Y + centerY*BLOCK_SIZE, (Math.floor(gametime/20))%3, 0);
		} else {
			drawBlock(centerX, centerY);
			drawBlock(centerX + x[0], centerY + y[0]);
			drawBlock(centerX + x[1], centerY + y[1]);
			drawBlock(centerX + x[2], centerY + y[2]);
		}
	}

	// 画面に表示するブロック
	function drawBlock(posX, posY){
		ctx.fillStyle = getBlockColor(type);
		ctx.fillRect(FIELD_POS_X + posX*BLOCK_SIZE, FIELD_POS_Y + posY*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
	}

	// キャラチップの描画
	function drawChip(img, posX, posY, imgX, imgY){
 		ctx.drawImage(img, imgX*BLOCK_SIZE, imgY*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, posX, posY, BLOCK_SIZE, BLOCK_SIZE);
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
			case 'F' :
				return 'brown';
			default :
				return 'white';
		}
	}
})();