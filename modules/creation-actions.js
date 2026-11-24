/**
 * GY-GY Club — reusable actions for a completed creative work.
 * v1.1.0 — Sharing accepts a case-only story; phrase-dependent Atelier actions still require a phrase.
 */

function normalizeWork(value) {
  return { situation: String(value?.situation ?? '').trim(), phrase: String(value?.phrase ?? '').trim() };
}
function formatWork(work) {
  const phrase = work.phrase ? `\n\nКРЕПКОЕ ВЫРАЖЕНИЕ\n${work.phrase}` : '';
  return `СЛУЧАЙ\n${work.situation}${phrase}`;
}
function createNewsChoice(root, onSubmit, onCancel) {
  const old = root.querySelector('.creation-news-choice');
  if (old) old.remove();
  const panel = document.createElement('div');
  panel.className = 'creation-news-choice';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Категория GY-GY NEWS');
  const label = document.createElement('label');
  label.textContent = 'Предложить в рубрику: ';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Рубрика GY-GY NEWS');
  [['THIS_IS_GREAT','ЭТО КРУТО'],['WHAT_A_CASE','ВОТ ЭТОТ СЛУЧАЙ']].forEach(([value,text]) => {
    const option=document.createElement('option'); option.value=value; option.textContent=text; select.append(option);
  });
  label.append(select);
  const submit=document.createElement('button'); submit.type='button'; submit.className='gold-button'; submit.textContent='Подготовить предложение'; submit.addEventListener('click',()=>onSubmit(select.value));
  const cancel=document.createElement('button'); cancel.type='button'; cancel.className='outline-button'; cancel.textContent='Отмена'; cancel.addEventListener('click',()=>{panel.remove();onCancel?.();});
  panel.append(label,submit,cancel); root.append(panel); select.focus(); return panel;
}
export function initCreationActions({root,getWork,getAtelierUrl,onStatus=()=>{}}={}) {
  if(!root||typeof getWork!=='function') throw new TypeError('[creation-actions] root and getWork are required.');
  let destroyed=false,newsPanel=null,chatFrame=null,chatMessageHandler=null;
  const status=message=>{if(!destroyed)onStatus(message);};
  const getShareableWork=()=>{const work=normalizeWork(getWork());if(!work.situation){status('Сначала расскажи, что произошло.');return null;}return work;};
  // Hide the chat on return to Studio, but keep its live document mounted.
  // This preserves the participant's topic, scroll position and unfinished composer state.
  const hideChat=()=>{
    if(!chatFrame)return;
    chatFrame.style.display='none';
    document.documentElement.style.overflow='';
  };
  const destroyChat=()=>{
    if(!chatFrame)return;
    window.removeEventListener('message',chatMessageHandler);
    chatMessageHandler=null;
    chatFrame.remove();
    chatFrame=null;
    document.documentElement.style.overflow='';
  };
  const openChat=()=>{
    if(chatFrame){
      chatFrame.style.display='block';
      document.documentElement.style.overflow='hidden';
      return;
    }
    chatFrame=document.createElement('iframe');
    chatFrame.title='GY-GY Club — THE CHAT ROOM';
    chatFrame.src=new URL('./Development/DESTRESS_STUDIO/destress-chat.html',document.baseURI).href;
    chatFrame.setAttribute('allow','clipboard-read; clipboard-write');
    chatFrame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483000;background:#100e0b;';
    chatMessageHandler=event=>{
      if(event.source!==chatFrame?.contentWindow||event.origin!==location.origin)return;
      if(event.data?.type==='GYGY_CHAT_CLOSE')hideChat();
    };
    window.addEventListener('message',chatMessageHandler);
    document.documentElement.style.overflow='hidden';
    document.body.append(chatFrame);
  };
  const openTelegram=work=>{
    const text=formatWork(work);
    const shareUrl='https://t.me/share/url?url='+encodeURIComponent(location.href)+'&text='+encodeURIComponent(text+'\n— GY-GY Club');
    window.open(shareUrl,'_blank','noopener,noreferrer');
    status('Открываю Telegram. Проверь текст и подтверди отправку там.');
  };
  const onClick=async event=>{
    const button=event.target.closest('[data-creation-action]');
    if(!button||!root.contains(button)||destroyed)return;
    const action=button.dataset.creationAction;
    // CHAT — самостоятельное пространство клуба: ему не требуется готовая работа.
    if(action==='chat'){openChat();return;}
    const work=getShareableWork(); if(!work)return;
    const text=formatWork(work);
    switch(action){
      case 'atelier': {
        if(!work.phrase){status('Для переноса в Atelier нужно заполнить «Библиотеку крепких слов».');return;}
        if(typeof getAtelierUrl!=='function'){status('Переход в Ателье пока не настроен для этого раздела.');return;}
        const url=getAtelierUrl(work,false);if(!url){status('Не удалось подготовить ссылку на Ателье.');return;}
        window.location.href=url;return;
      }
      case 'telegram': openTelegram(work);return;
      case 'friend':
        try{
          if(navigator.share){await navigator.share({title:'GY-GY Club — авторская работа',text});status('Окно отправки закрыто. Доставка зависит от выбранного приложения.');}
          else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);status('Работа скопирована. Теперь можно отправить её другу.');}
          else status('Отправка не поддерживается этим браузером. Скопируй текст вручную.');
        }catch(error){if(error?.name!=='AbortError')status('Не удалось открыть отправку. Попробуй скопировать текст вручную.');}
        return;
      case 'archive':
        try{
          const blob=new Blob([text+'\n— GY-GY Club\n'],{type:'text/plain;charset=utf-8'});
          const url=URL.createObjectURL(blob),link=document.createElement('a'),date=new Date().toISOString().slice(0,10);
          link.href=url;link.download=`gygy-destress-work-${date}.txt`;document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),30000);
          status('Подготовлен файл со случаем и крепким выражением. Дальнейшее сохранение зависит от устройства и браузера.');
        }catch{status('Не удалось подготовить файл для загрузки.');}
        return;
      case 'news':
        newsPanel?.remove();
        newsPanel=createNewsChoice(root,category=>{
          newsPanel?.remove();newsPanel=null;
          const categoryName=category==='THIS_IS_GREAT'?'ЭТО КРУТО':'ВОТ ЭТОТ СЛУЧАЙ';
          status(`Предложение для GY-GY NEWS («${categoryName}») подготовлено. Серверная отправка и публикация пока не подключены.`);
        },()=>{newsPanel=null;});
        status('Выбери рубрику для предложения. Публикация пока не отправляется на сервер.');return;
      default: status('Это действие пока не настроено.');
    }
  };
  root.addEventListener('click',onClick);
  return {
    destroy(){
      if(destroyed)return;destroyed=true;root.removeEventListener('click',onClick);
      newsPanel?.remove();newsPanel=null;destroyChat();
    }
  };
}
export default initCreationActions;
