<?php
/**
 * Template Name: Front Page
 *
 * @package YetiBreath
 */
get_header(); ?>


<div id="primary" class="content-area">
	<main id="main" class="site-main" role="main">
		<?php while ( have_posts() ) : the_post(); ?>
			<?php get_template_part( 'components/features/hero-image/content', 'hero' ); ?>
		<?php endwhile; ?>

		<?php get_template_part( 'components/features/testimonials/testimonials' ); ?>
	</main>
</div>

<?php get_footer(); ?>
