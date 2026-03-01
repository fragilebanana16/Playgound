const PALETTE_HTML = $(`<div class="config-palette">

        <div class="config-palette__wrapper">
			<div class="config-options__wrap">
                <div id="body_colors" class="config-options">
                    <ul>
                    </ul>
                </div>

                <div id="custom_shader" class="config-options">
                    <ul>
                    </ul>
                </div>

                <div id="start" class="config-options">
                    <ul>
                    </ul>
                </div>

                <div id="test_light" class="config-options">
                    <ul>
                    </ul>
                </div>

                <div id="custom_texture" class="config-options">
                    <ul>
                    </ul>
                </div>
            </div>
            <ul class="config-tab__list">
                <li>
                    <a class="config-tab" data-id="body_colors">
                        <button class="button">
						  <div class="button-outer">
							<div class="button-inner">
							  <span>Body</span>
							</div>
						  </div>
						</button>
                    </a>
                </li>
                <li>
                    <a class="config-tab" data-id="custom_shader">
                        <button class="button">
						  <div class="button-outer">
							<div class="button-inner">
							  <span>Shader</span>
							</div>
						  </div>
						</button>
                    </a>
                </li>
                <li>
                    <a class="config-tab" data-id="start">
                        <button class="button">
						  <div class="button-outer">
							<div class="button-inner">
							  <span>Start</span>
							</div>
						  </div>
						</button>
                    </a>
                </li>
                <li>
                    <a class="config-tab" data-id="test_light">
                        <button class="button">
						  <div class="button-outer">
							<div class="button-inner">
							  <span>Light</span>
							</div>
						  </div>
						</button>
                    </a>
                </li>
                <li>
                    <a class="config-tab" data-id="custom_texture">
                        <button class="button">
						  <div class="button-outer">
							<div class="button-inner">
							  <span>Texture</span>
							</div>
						  </div>
						</button>
                    </a>
                </li>
            </ul>
        </div>
     </div>`);


const UserInterface = (() => {
    let cbOnEntityColor = (target, color) => void 0;
    let cbOnEntityVisible = (target) => void 0;
    let cbOnCustomShader = (target) => void 0;
	
    const initialize = (meta) => {
        $('body').append(PALETTE_HTML);
        $('.config-tab', PALETTE_HTML).on('click', onConfigTabClicked);
    };
	
	const appendColorOption = (container, cb) => {
	    $(container).empty();

	    var colorList = ['#F77F21', '#FC4705', '#4393E6']
	    colorList.forEach(color => {
	        const swatch = $(`<li><button class="color-swatch"><span>${color}</span></button></li>`)
	            $('button', swatch).css({
	                "background": color
	            });
	        $('button', swatch).on('click', ((c) => {
	                return () => cb(c)
	            })(color));
	        $(container).append(swatch);
	    })
	}
	
	const appendTextureOption= (container, cb) => {
        $(container).empty();
        ['t1', 't2'].forEach(texture => {
            const url = `assets/${texture}.png`;
            const swatch = $(`<li><button class="texture-swatch"><span>${texture}</span></button></li>`)
            $('button', swatch).css({ 'background-image': 'url(' + url + ')', 'background-size': '100px' });
            $('button', swatch).on('click', ((t) => {
                    return () => cb(t)
                })(texture));
            $(container.append(swatch));
        })
    }
	
	const onConfigTabClicked = (item) => {
        const target = $(item.currentTarget)
        const tabId = target.data('id');
        if (target.hasClass("active")) {
            $(`#${tabId} > ul`, PALETTE_HTML).empty();
            // 取消时也触发，传个状态区分开/关
            if (tabId.startsWith('test_light') && cbOnLight) {
                cbOnLight(false);
            }
            if (tabId.startsWith('start') && cbOnLight) {
                cbOnStart(false);
            }
            return target.removeClass('active');
        }
        $('.config-tab', PALETTE_HTML).removeClass('active');
        $('.config-options', PALETTE_HTML).hide();
        const container = $(`#${tabId} > ul`, PALETTE_HTML);
		if (tabId.startsWith('body_colors')) {
			if (!cbOnEntityColor) return;
			appendColorOption(container, (color) => {
				cbOnEntityColor('Mt_Body', color);
			})
		} else if (tabId.startsWith('custom_shader')) {
			cbOnCustomShader('Mt_Body');
		} else if(tabId.startsWith('custom_texture')){
            if (!cbOnEntityTexture) return;
			appendTextureOption(container, (target) => {
                cbOnEntityTexture('CustomTexture', target);
            })
		} else if(tabId.startsWith('start')){
            if (!cbOnStart) return;
			cbOnStart(true);
		}  else if(tabId.startsWith('test_light')){
            if (!cbOnLight) return;
			cbOnLight(true);
		} 
		
        $(`.config-tab[data-id=${tabId}]`, PALETTE_HTML).addClass("active");
        $(`#${tabId}`, PALETTE_HTML).show();
	};
	
    const setOnEntityColor = (cb) => cbOnEntityColor = cb;
    const setOnEntityTexture = (cb) => cbOnEntityTexture = cb;
    const setOnCustomShader = (cb) => cbOnCustomShader = cb;
    const setOnStart = (cb) => cbOnStart = cb;
    const setOnLight = (cb) => cbOnLight = cb;
	
    return { initialize, setOnLight, setOnEntityColor, setOnEntityTexture, setOnCustomShader, setOnStart }
})();