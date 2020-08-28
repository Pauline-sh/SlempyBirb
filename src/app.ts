import backgroundDaySprite from '../resources/sprites/background-day.png';
import backgroundNightSprite from '../resources/sprites/background-night.png';
import baseSprite from '../resources/sprites/base.png';
import birdDownflapSprite from '../resources/sprites/bluebird-downflap.png';
import birdMidflapSprite from '../resources/sprites/bluebird-midflap.png';
import birdUpflapSprite from '../resources/sprites/bluebird-upflap.png';
import pipeBottomSprite from '../resources/sprites/pipe-green-bottom.png';
import pipeTopSprite from '../resources/sprites/pipe-green-top.png';

import messageSprite from '../resources/sprites/message.png';
import gameOverSprite from '../resources/sprites/gameover.png';

import zeroSprite from '../resources/sprites/0.png';
import oneSprite from '../resources/sprites/1.png';
import twoSprite from '../resources/sprites/2.png';
import threeSprite from '../resources/sprites/3.png';
import fourSprite from '../resources/sprites/4.png';
import fiveSprite from '../resources/sprites/5.png';
import sixSprite from '../resources/sprites/6.png';
import sevenSprite from '../resources/sprites/7.png';
import eightSprite from '../resources/sprites/8.png';
import nineSprite from '../resources/sprites/9.png';

import rewardOne from '../resources/rewards/lovely-rat.webp';
import rewardTwo from '../resources/rewards/fine-grilled-cheese.webp';
import rewardThree from '../resources/rewards/made-for-little-hands.webp';

const SPEED = 1;

const BIRB_X = 20;

const GAP = 80;

const DEFAULT_PIPE_TOP_Y = -100;
const MIN_PIPE_TOP_Y = 50;
const MAX_PIPE_TOP_Y = -50;

const NEW_PIPE_THRESHOLD = 125;

// Inclusive min, exclusive max.
const getRandomInt = (min: number, max: number): number => {
	return Math.floor(Math.random() * (max - min) + min);
}

const loadImage = (img: HTMLImageElement, src: any): Promise<HTMLImageElement> => {
	const promise = new Promise<HTMLImageElement>((resolve) =>
			img.addEventListener('load', () => resolve(img)));
	img.src = src;

	return promise;
}

interface Coordinates {
	x: number;
	y: number;
}

enum GameStage {
	GAMEOVER,
	PAUSED,
	RUNNING,
	READY_TO_START,
}

enum BirbState {
	RISING,
	MIDFLAP,
	FALLING,
}

class RewardModal {
	private gameController: Game;
	private rewardButton: HTMLElement;
	private rewardButtonClose: HTMLElement;
	private rewardButtonDislike: HTMLElement;
	private rewardButtonLike: HTMLElement;
	private rewardImg: HTMLImageElement;
	private rewardModalElement: HTMLElement;

	private handleRewardButtonClickBound: (e: Event) => void =
			(e: Event) => this.handleRewardButtonClick(e);
	private handleRewardCloseClickBound: (e: Event) => void =
			(e: Event) => this.handleRewardCloseClick(e);
	private handleOpinionButtonClickBound: (e: Event) => void =
			(e: Event) => this.handleOpinionButtonClick(e);

	constructor(gameController: Game) {
			this.gameController = gameController;

			this.rewardButton = <HTMLElement>document.querySelector('#get-reward');
			this.rewardImg = <HTMLImageElement>document.querySelector('#reward-img');
			this.rewardModalElement = <HTMLImageElement>document.querySelector('#reward-modal');
			this.rewardButtonClose = <HTMLElement>document.querySelector('#close');
			this.rewardButtonDislike = <HTMLElement>document.querySelector('#dislike');
			this.rewardButtonLike = <HTMLElement>document.querySelector('#like');

			this.rewardButton.addEventListener('click', this.handleRewardButtonClickBound);
			this.rewardButtonClose.addEventListener('click', this.handleRewardCloseClickBound);
			this.rewardButtonDislike.addEventListener('click', this.handleOpinionButtonClickBound);
			this.rewardButtonLike.addEventListener('click', this.handleOpinionButtonClickBound);
	}

	private showRewardModal(): void {
		this.rewardModalElement.setAttribute('style', 'display: flex');
	}

	private hideRewardModal(): void {
		this.rewardModalElement.setAttribute('style', 'display: none');
	}

	private chooseReward(): any {
		const rewards = [rewardOne, rewardTwo, rewardThree];
		const randomRewardIndex = getRandomInt(0, rewards.length);
		return rewards[randomRewardIndex];
	}


	public unlockReward(): void {
		this.rewardButton.setAttribute('style', 'visibility: visible; opacity: 1; pointer-events: auto;');
	}

	private handleOpinionButtonClick(e: Event): void {
		e.stopPropagation();
		const targetElement = <HTMLElement>e.target;
		const secretMessage = targetElement.id === 'like'
				? `Rats are gorgeous, cheese is delicious, Our tastes are alike and You are so precious! (◕‿◕)♡`
				: `Roses are red, cheese is yummy, don't you like rats? - I'll try better ┐( ˘ ､ ˘ )┌`;

		console.log(secretMessage);
		this.hideRewardModal();
		this.gameController.resume();
	}

	private handleRewardCloseClick(e: Event): void {
		e.stopPropagation();
		this.hideRewardModal();
		this.gameController.resume();
	}

	private handleRewardButtonClick(e: Event): void {
		e.stopPropagation();
		this.gameController.pause();

		this.rewardImg.src = this.chooseReward();
		this.showRewardModal();
	}
}

class Game {
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;

	private pipes: Coordinates[] = [];
	private velocity = 2;
	private birbY: number = 0;
	private stage: GameStage = GameStage.READY_TO_START;
	private needToReset: boolean = true;
	private score: number = 0;

	private base: HTMLImageElement;
	private newgame: HTMLImageElement;
	private gameover: HTMLImageElement;
	private pipeTop: HTMLImageElement;
	private pipeBottom: HTMLImageElement;

	private background: HTMLImageElement | null = null;
	private backgrounds: HTMLImageElement[] = [];
	private birb: HTMLImageElement | null = null;
	private birbs: HTMLImageElement[] = [];
	private numbers: HTMLImageElement[] = [];

	private rewardModal: RewardModal;

	private handleClickBound: () => void = () => this.handleClick();

	constructor() {
		this.canvas = <HTMLCanvasElement>document.querySelector('#canvas');
		this.context = this.canvas.getContext('2d')!;
		this.rewardModal = new RewardModal(this);

		this.base = new Image();
		this.newgame = new Image();
		this.gameover = new Image();
		this.pipeTop = new Image();
		this.pipeBottom = new Image();
		this.backgrounds.push(new Image(), new Image());
		this.birbs.push(new Image(), new Image(), new Image());
		this.numbers.push(new Image(), new Image(), new Image(),
				new Image(), new Image(), new Image(), new Image(),
				new Image(), new Image(), new Image());
	}

	public async run(): Promise<void> {
		await this.loadImages();
		this.resetIfNeeded();

		window.addEventListener('click', this.handleClickBound);
	}

	public resume(): void {
		this.stage = GameStage.RUNNING;
		this.drawLoop();
	}

	public pause(): void {
		this.stage = GameStage.PAUSED;
	}

	private drawLoop(): void {
		if (this.stage === GameStage.PAUSED) {
			return;
		}

		if (this.stage === GameStage.GAMEOVER) {
			this.gameOver();
			return;
		}

		this.birb = this.selectBirb();

		this.context.drawImage(this.background!, 0, 0);
		this.drawPipes();
		this.context!.drawImage(this.birb, BIRB_X, this.birbY);
		this.context.drawImage(this.base, 0, this.canvas!.height - this.base.height);
		this.displayScore();

		if (this.velocity < 2) {
			this.velocity += 0.1;
		}
		this.birbY += this.velocity;

		requestAnimationFrame(() => this.drawLoop());
	}

	private async loadImages(): Promise<void> {
		await Promise.all([
			loadImage(this.base, baseSprite),
			loadImage(this.pipeTop, pipeTopSprite),
			loadImage(this.pipeBottom, pipeBottomSprite),
			loadImage(this.newgame, messageSprite),
			loadImage(this.gameover, gameOverSprite),
			loadImage(this.backgrounds[0], backgroundDaySprite),
			loadImage(this.backgrounds[1], backgroundNightSprite),
			loadImage(this.birbs[BirbState.FALLING], birdUpflapSprite),
			loadImage(this.birbs[BirbState.MIDFLAP], birdMidflapSprite),
			loadImage(this.birbs[BirbState.RISING], birdDownflapSprite),
			loadImage(this.numbers[0], zeroSprite),
			loadImage(this.numbers[1], oneSprite),
			loadImage(this.numbers[2], twoSprite),
			loadImage(this.numbers[3], threeSprite),
			loadImage(this.numbers[4], fourSprite),
			loadImage(this.numbers[5], fiveSprite),
			loadImage(this.numbers[6], sixSprite),
			loadImage(this.numbers[7], sevenSprite),
			loadImage(this.numbers[8], eightSprite),
			loadImage(this.numbers[9], nineSprite),
		]);
	}

	private flyUp(): void {
		this.velocity = this.velocity - 5 < -4
				? -4
				: this.velocity - 5;
	}

	private checkCollisions(pipe: Coordinates): boolean {
		const birbRight = BIRB_X + this.birb!.width;
		const birbBottom = this.birbY + this.birb!.height;
		const pipeTopEdge = pipe.y + this.pipeTop.height;
		const pipeBottomEdge = pipe.y + this.pipeTop.height + GAP;

		if (birbRight > pipe.x && birbRight < pipe.x + this.pipeTop.width &&
			 (this.birbY < pipeTopEdge || birbBottom > pipeBottomEdge)) {
			return true;
		}

		if (this.birbY + this.birb!.height > this.canvas!.height - this.base.height ||
				this.birbY < 0) {
			return true;
		}

		return false;
	}

	private selectBirb(): HTMLImageElement {
		if (this.velocity > 0.12) {
			return this.birbs[BirbState.RISING];
		}
		if (this.velocity < -0.12) {
			return this.birbs[BirbState.FALLING];
		}
		return this.birbs[BirbState.MIDFLAP];
	}

	private gameOver(): void {
		this.context.drawImage(this.gameover,
				this.canvas.width / 2 - this.gameover.width / 2,
				this.canvas.height / 2 - this.gameover.height / 2);
		this.needToReset = true;
	}

	private displayScore(): void {
		const scoreNumbers = this.score.toString().split('');
		const scoreXStart = this.canvas.width - 10;
		const scoreY = this.canvas.height - 10 - this.numbers[0].height;
		let scoreWidth = 0;

		for (let i = 0; i < scoreNumbers.length; i++) {
			const curNumStr = scoreNumbers[scoreNumbers.length - 1 - i]
			const curNum = parseInt(curNumStr, 10);
			const curNumWidth = this.numbers[curNum].width;
			const curNumX = scoreXStart - scoreWidth - curNumWidth;
			scoreWidth += curNumWidth;
			this.context!.drawImage(this.numbers[curNum], curNumX, scoreY);
		}
	}

	private drawPipes(): void {
		let scored = false;
		for (let i = 0; i < this.pipes.length; i++) {
			const pipe = this.pipes[i];
			this.context.drawImage(this.pipeTop, pipe.x, pipe.y);
			this.context.drawImage(this.pipeBottom,
				pipe.x, pipe.y + this.pipeBottom.height + GAP);
			pipe.x -= SPEED;

			// Add pipe if needed.
			if (pipe.x === NEW_PIPE_THRESHOLD) {
				this.pipes.push({
					x: this.canvas.width,
					y: getRandomInt(MIN_PIPE_TOP_Y - this.pipeTop.height, MAX_PIPE_TOP_Y),
				});
			}

			if (this.checkCollisions(pipe)) {
				this.context!.drawImage(this.birb!, BIRB_X, this.birbY);
				this.context.drawImage(this.base, 0, this.canvas.height - this.base.height);
				this.stage = GameStage.GAMEOVER;
			}

			// Check score.
			if (!scored && pipe.x + this.pipeTop.width - 10 === BIRB_X) {
				this.score++;
				scored = false;

				if (this.score >= 5) {
					this.rewardModal.unlockReward();
				}
			}

			// Remove pipe if it's off screen.
			if (pipe.x + this.pipeTop.width < 0) {
				this.pipes.shift();
				i = i - 1;
			}
		}
	}

	private resetIfNeeded(): void {
		if (!this.needToReset) {
			return;
		}
		this.needToReset = false;

		this.velocity = 0;
		this.score = 0;
		this.birb = this.selectBirb();
		this.birbY = Math.floor(this.canvas.height / 2) - Math.floor(this.birb.height / 2);

		const randomBackgroundIndex = getRandomInt(0, this.backgrounds.length);
		this.background = this.backgrounds[randomBackgroundIndex];

		this.context.drawImage(this.background, 0, 0);
		this.context!.drawImage(this.birb, BIRB_X, this.birbY);
		this.context.drawImage(this.base, 0, this.canvas!.height - this.base.height);
		this.context.drawImage(this.newgame,
				this.canvas.width / 2 - this.newgame.width / 2,
				this.canvas.height / 2 - this.newgame.height / 2);

		this.pipes = [{
			x: this.canvas.width,
			y: DEFAULT_PIPE_TOP_Y,
		}];
	}

	private handleClick(): void {
		switch (this.stage) {
			case GameStage.RUNNING:
				this.flyUp();
				break;
			case GameStage.READY_TO_START:
				this.stage = GameStage.RUNNING;
				this.resetIfNeeded();
				this.drawLoop();
				break;
			case GameStage.GAMEOVER:
				this.stage = GameStage.READY_TO_START;
				this.resetIfNeeded();
				break;
			default:
				return;
		}
	}
}

const slempyBirb = new Game();
slempyBirb.run();