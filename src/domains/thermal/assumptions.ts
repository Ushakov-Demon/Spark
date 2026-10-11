import type { ModelAssumption } from '../../core/solver.js';

/** What the thermal model deliberately simplifies. Shown in every explanation. */
export const THERMAL_ASSUMPTIONS: readonly ModelAssumption[] = [
  {
    id: 'thermal.lumped',
    text: {
      novice: {
        uk: 'Вважаємо, що вся вода в чайнику має однакову температуру — ніби її весь час перемішують.',
        en: 'We assume all the water in the kettle has the same temperature — as if it were stirred all the time.',
      },
      school: {
        uk: 'Кожне тіло має одну температуру на все тіло одразу. Насправді біля дна чайника вода гарячіша, ніж зверху.',
        en: 'Each body has a single temperature throughout. In reality the water near the kettle bottom is hotter than at the top.',
      },
      advanced: {
        uk: 'Кожне тіло — одна точка з однією температурою. Добре працює для невеликих або добре перемішаних тіл.',
        en: 'Each body is one point with one temperature. Works well for small or well-mixed bodies.',
      },
      expert: {
        uk: 'Модель зосереджених ємностей (lumped capacitance). Коректна за числа Біо Bi = hL/k ≲ 0,1; для великих твердих тіл потрібна сітка (розподілене поле температур).',
        en: 'Lumped-capacitance model. Valid for Biot number Bi = hL/k ≲ 0.1; large solids need a mesh (distributed temperature field).',
      },
    },
  },
  {
    id: 'thermal.no-phase-change',
    text: {
      novice: {
        uk: 'Поки що модель не вміє кип’ятити й заморожувати воду: вище 100 °C вода в ній просто гріється далі.',
        en: 'The model cannot boil or freeze water yet: above 100 °C the water simply keeps warming.',
      },
      school: {
        uk: 'Кипіння, випаровування і плавлення поки не враховуються: вище 100 °C вода в моделі залишається рідиною і продовжує нагріватися.',
        en: 'Boiling, evaporation and melting are not modelled yet: above 100 °C the water stays liquid and keeps heating.',
      },
      expert: {
        uk: 'Фазові переходи і прихована теплота не моделюються; температура не обмежена точкою кипіння.',
        en: 'Phase changes and latent heat are not modelled; temperature is not capped at the boiling point.',
      },
    },
  },
  {
    id: 'thermal.constant-properties',
    text: {
      school: {
        uk: 'Теплоємність і теплопровідність речовин вважаємо сталими, хоча насправді вони трохи змінюються з температурою.',
        en: 'Heat capacity and conductivity are treated as constants, although in reality they change slightly with temperature.',
      },
      expert: {
        uk: 'c і k — константи за ~20–25 °C (див. довідник матеріалів); їхня температурна залежність не враховується.',
        en: 'c and k are constants at ~20–25 °C (see the materials table); their temperature dependence is ignored.',
      },
    },
  },
  {
    id: 'thermal.linear-transfer',
    text: {
      school: {
        uk: 'Тепловіддачу повітрю описуємо одним числом — коефіцієнтом тепловіддачі. Окремо випаровування і випромінювання не рахуємо.',
        en: 'Heat loss to the air is described by one number, the heat transfer coefficient. Evaporation and radiation are not counted separately.',
      },
      expert: {
        uk: 'Конвекцію і випромінювання зведено до лінійної провідності G = hA; h — оціночне значення і не залежить від різниці температур (реальна природна конвекція нелінійна).',
        en: 'Convection and radiation are lumped into a linear conductance G = hA; h is an estimate independent of the temperature difference (real natural convection is non-linear).',
      },
    },
  },
  {
    id: 'thermal.numerics',
    text: {
      school: {
        uk: 'Комп’ютер рахує не неперервно, а дуже малими кроками в часі — так само, як відео складається з кадрів.',
        en: 'The computer does not calculate continuously but in very small time steps — just as a video is made of frames.',
      },
      expert: {
        uk: 'Явний метод Ейлера з автоматичним підкроком h ≤ 0,5·min(Cᵢ/ΣGᵢⱼ) (умова стійкості). Потоки по зв’язках антисиметричні, тож енергія зберігається з машинною точністю; похибка за часом — O(h).',
        en: 'Explicit Euler with automatic sub-stepping h ≤ 0.5·min(Cᵢ/ΣGᵢⱼ) (stability condition). Link flows are antisymmetric, so energy is conserved to machine precision; time error is O(h).',
      },
    },
  },
];
