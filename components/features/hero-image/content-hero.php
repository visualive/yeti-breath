<?php
/**
 * The template used for displaying hero content.
 *
 * @package YetiBreath
 */
?>

<?php if ( has_post_thumbnail() ) : ?>
	<div class="yetibreath-hero">
		<?php the_post_thumbnail( 'yetibreath-hero' ); ?>
	</div>
<?php endif; ?>
