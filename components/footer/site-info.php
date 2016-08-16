<?php
/**
 * The template used for displaying site info.
 *
 * @package YetiBreath
 */
?>
<div class="site-info">
	<a href="<?php echo esc_url( __( 'https://wordpress.org/', 'yetibreath' ) ); ?>"><?php printf( esc_html__( 'Proudly powered by %s', 'yetibreath' ), 'WordPress' ); ?></a>
	<span class="sep"> | </span>
	<?php printf( esc_html__( 'Theme: %1$s by %2$s.', 'yetibreath' ), 'YetiBreath', '<a href="http://automattic.com/" rel="designer">Automattic</a>' ); ?>
</div><!-- .site-info -->
