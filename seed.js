import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ujzupmmvfrhpwziudydr.supabase.co';
const supabaseKey = 'sb_publishable_zqGOuDGYCAin5goXvlM5-Q_pliMNwlj'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking for settings...");
  let { data: settings } = await supabase.from('settings').select('*').limit(1).single();
  if(!settings) {
    console.log("No settings found. Creating default settings...");
    await supabase.from('settings').insert({
      id: 1,
      slider_enabled: true,
      telegram_popup_enabled: true,
      video_popup_enabled: true,
      telegram_title: "Join Our Telegram",
      telegram_desc: "Get daily updates and fast customer support.",
      telegram_link: "https://t.me/showpay",
      mpin_delay: 2000,
      logout_delay: 2000,
      success_message: "Your account updated successfully.<br />Please wait some time.",
      default_gmail: "admin@showpay.com"
    });
  } else {
    console.log("Settings found. Updating...");
    await supabase.from('settings').update({
        slider_enabled: true
    }).eq("id", 1);
  }

  console.log("Checking for slider images...");
  const { data: slides } = await supabase.from('slider_images').select('*');
  if(!slides || slides.length === 0) {
    console.log("No slider images found. Seeding default images...");
    await supabase.from('slider_images').insert([
      { image_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=800', sort_order: 1, is_enabled: true },
      { image_url: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=800', sort_order: 2, is_enabled: true }
    ]);
  } else {
    console.log("Slider images already exist.");
  }
  console.log("Done seeding.");
}

run();
