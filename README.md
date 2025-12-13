# School Escape - Action Arcade Game

A fast-paced browser game where you play as a student escaping teachers in a dynamically generated school building. Collect all homework pages and reach the exit without getting caught!

## How to Play

Simply open `index.html` in any modern web browser.

### Controls

| Key | Action |
|-----|--------|
| **WASD** or **Arrow Keys** | Move |
| **SPACE** | Dash (quick burst of speed) |
| **1, 2, 3** | Use collected power-ups |
| **ESC** | Pause game |

### Objective

1. Collect all homework pages scattered around the school
2. Avoid the teachers patrolling the corridors
3. Reach the EXIT door (turns green when all items collected)

### Power-ups

| Power-up | Icon | Effect |
|----------|------|--------|
| Hall Pass | scroll | Temporary invincibility (5 seconds) |
| Energy Drink | lightning | Super speed boost (8 seconds) |
| Stink Bomb | smoke | Stuns all nearby teachers (4 seconds) |
| Skateboard | skateboard | Extended speed boost (10 seconds) |

### Teacher Types

| Type | Behavior |
|------|----------|
| **Patrol Teacher** | Follows set patrol routes, predictable |
| **Hunter Teacher** | Actively chases you when spotted |
| **Fast Teacher** | Quick but follows basic patterns |

### Obstacles

- **Desks** - Block movement, found in classrooms
- **Lockers** - Solid obstacles in corridors
- **Wet Floor** - Makes you slide faster but harder to control

## Game Configuration

Customize your game before starting:

### School Types
- **Elementary** (Easy) - Simple layout, slower teachers
- **Middle School** (Medium) - Balanced difficulty
- **High School** (Hard) - Complex layout, faster teachers
- **University** (Expert) - Large maps, aggressive teachers

### Map Sizes
- **Small** - Quick games, compact layout
- **Medium** - Standard experience
- **Large** - Longer games, more exploration

### Teacher Count
Adjust from 2-8 teachers for your preferred challenge level.

## Scoring System

- **100 points** per homework page collected
- **Combo multiplier** (up to x10) for quick consecutive pickups
- **500 bonus points** per life remaining when you escape
- Keep your combo going - it resets after 2 seconds of no pickups!

## Features

- **Dynamically generated school layouts** - Every game is different
- **Parametric map configuration** - Customize difficulty
- **Multiple power-ups** - Strategic item usage
- **Combo system** - Reward skillful play
- **Minimap** - Track teachers and collectibles
- **Smooth animations** - 60fps gameplay
- **Particle effects** - Satisfying visual feedback
- **Screen shake** - Impact feedback

## Technical Details

- Built with vanilla HTML5, CSS3, and JavaScript
- No external dependencies required
- Uses HTML5 Canvas for rendering
- Runs entirely client-side in your browser

## Browser Support

Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## License

See LICENSE file for details.
