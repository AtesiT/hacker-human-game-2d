import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  // Относительные пути: сборка работает и в подпапке (GitHub Pages), и прямо с диска.
  base: './',

  // `npm run build` упаковывает игру в один dist/index.html (код, стили и шрифт внутри).
  // Такой файл открывается двойным кликом — без сервера и без Node.
  plugins: [viteSingleFile()],

  server: {
    // `npm run dev` сам открывает игру во вкладке браузера.
    open: true,
  },

  build: {
    // Phaser весит около 1,2 МБ — это ожидаемо, предупреждение о размере не нужно.
    chunkSizeWarningLimit: 2000,
  },
});
